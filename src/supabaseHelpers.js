import { supabase } from './supabaseClient';
import {
  getCachedSnapshot,
  removeCachedRecord,
  replaceCachedTable,
  upsertCachedRecord,
} from './offlineStore';
import {
  isNetworkError,
  isOffline,
  queueMutation,
  startOfflineSync,
} from './offlineSync';

const createId = () => crypto.randomUUID();

const partFromRow = (part) => ({
  id: part.id,
  partNumber: part.part_number,
  name: part.name,
  category: part.category,
  brand: part.brand,
  purchasePrice: Number(part.purchase_price),
  sellingPrice: Number(part.selling_price),
  stock: Number(part.stock),
  reorderLevel: Number(part.reorder_level),
  supplier: part.supplier,
  location: part.location,
});

const saleFromRow = (sale) => ({
  id: sale.id,
  date: sale.date,
  time: sale.time,
  partNumber: sale.part_number,
  partName: sale.part_name,
  quantity: Number(sale.quantity),
  purchasePrice: Number(sale.purchase_price),
  sellingPrice: Number(sale.selling_price),
  total: Number(sale.total),
  profit: Number(sale.profit),
  customer: sale.customer,
  soldBy: sale.sold_by,
});

const partPayload = (part, id) => ({
  id,
  part_number: part.partNumber,
  name: part.name,
  category: part.category,
  brand: part.brand || '',
  purchase_price: Number(part.purchasePrice),
  selling_price: Number(part.sellingPrice),
  stock: Number(part.stock),
  reorder_level: Number(part.reorderLevel),
  supplier: part.supplier || '',
  location: part.location || '',
});

const salePayload = (sale, id) => ({
  id,
  date: sale.date,
  time: sale.time,
  part_number: sale.partNumber,
  part_name: sale.partName,
  quantity: Number(sale.quantity),
  purchase_price: Number(sale.purchasePrice),
  selling_price: Number(sale.sellingPrice),
  total: Number(sale.total),
  profit: Number(sale.profit),
  customer: sale.customer,
  sold_by: sale.soldBy || '',
});

const supplierPayload = (supplier, id) => ({
  id,
  name: supplier.name,
  contact: supplier.contact || '',
  phone: supplier.phone || '',
  email: supplier.email || '',
  address: supplier.address || '',
});

const partFromPayload = (payload) => partFromRow(payload);
const saleFromPayload = (payload) => saleFromRow(payload);
const supplierFromPayload = (payload) => ({ ...payload });

const throwIfError = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const remoteAddPart = async (payload) => partFromRow(throwIfError(await supabase
  .from('parts')
  .insert(payload)
  .select()
  .single()));

const remoteUpdatePart = async (id, payload) => partFromRow(throwIfError(await supabase
  .from('parts')
  .update(payload)
  .eq('id', id)
  .select()
  .single()));

const remoteDeletePart = async (id) => throwIfError(await supabase.from('parts').delete().eq('id', id));

const remoteAddSale = async (payload) => saleFromRow(throwIfError(await supabase
  .from('sales')
  .insert(payload)
  .select()
  .single()));

const remoteDeleteSale = async (id) => throwIfError(await supabase.from('sales').delete().eq('id', id));

const remoteAddSupplier = async (payload) => supplierFromPayload(throwIfError(await supabase
  .from('suppliers')
  .insert(payload)
  .select()
  .single()));

const remoteUpdateSupplier = async (id, payload) => supplierFromPayload(throwIfError(await supabase
  .from('suppliers')
  .update(payload)
  .eq('id', id)
  .select()
  .single()));

const remoteDeleteSupplier = async (id) => throwIfError(await supabase.from('suppliers').delete().eq('id', id));

const applyQueuedMutation = async ({ table, operation, id, payload }) => {
  if (table === 'parts') {
    if (operation === 'add') return remoteAddPart(payload);
    if (operation === 'update') return remoteUpdatePart(id, payload);
    return remoteDeletePart(id);
  }
  if (table === 'sales') {
    if (operation === 'add') return remoteAddSale(payload);
    return remoteDeleteSale(id);
  }
  if (table === 'suppliers') {
    if (operation === 'add') return remoteAddSupplier(payload);
    if (operation === 'update') return remoteUpdateSupplier(id, payload);
    return remoteDeleteSupplier(id);
  }
  throw new Error(`Unsupported queued mutation: ${table}/${operation}`);
};

export const initialiseOfflineSync = () => startOfflineSync(applyQueuedMutation);

const queueWhenOffline = async ({ table, operation, id, payload, localRecord, request }) => {
  if (isOffline()) return queueMutation({ table, operation, id, payload, localRecord });

  try {
    const record = await request();
    if (operation === 'delete') {
      await removeCachedRecord(table, id);
      return record;
    }
    await upsertCachedRecord(table, record);
    return record;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return queueMutation({ table, operation, id, payload, localRecord });
  }
};

const fetchWithCache = async ({ table, request }) => {
  try {
    const records = await request();
    await replaceCachedTable(table, records);
    return records;
  } catch (error) {
    const snapshot = await getCachedSnapshot();
    if (isOffline() || snapshot[table]?.length) return snapshot[table] || [];
    console.error(`Unable to fetch ${table}:`, error);
    return [];
  }
};

export const fetchCategories = () => fetchWithCache({
  table: 'categories',
  request: async () => throwIfError(await supabase.from('categories').select('*').order('name')),
});

export const fetchParts = () => fetchWithCache({
  table: 'parts',
  request: async () => (throwIfError(await supabase.from('parts').select('*').order('name'))).map(partFromRow),
});

export const fetchSales = () => fetchWithCache({
  table: 'sales',
  request: async () => (throwIfError(await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false }))).map(saleFromRow),
});

export const fetchSuppliers = () => fetchWithCache({
  table: 'suppliers',
  request: async () => throwIfError(await supabase.from('suppliers').select('*').order('name')),
});

export const addPart = async (part) => {
  const id = part.id || createId();
  const payload = partPayload(part, id);
  return queueWhenOffline({
    table: 'parts', operation: 'add', id, payload, localRecord: partFromPayload(payload),
    request: () => remoteAddPart(payload),
  });
};

export const updatePart = async (id, part) => {
  const payload = partPayload(part, id);
  return queueWhenOffline({
    table: 'parts', operation: 'update', id, payload, localRecord: partFromPayload(payload),
    request: () => remoteUpdatePart(id, payload),
  });
};

export const deletePart = (id) => queueWhenOffline({
  table: 'parts', operation: 'delete', id, payload: { id }, localRecord: null,
  request: () => remoteDeletePart(id),
});

export const addSale = async (sale) => {
  const id = sale.id || createId();
  const payload = salePayload(sale, id);
  return queueWhenOffline({
    table: 'sales', operation: 'add', id, payload, localRecord: saleFromPayload(payload),
    request: () => remoteAddSale(payload),
  });
};

export const deleteSale = (id) => queueWhenOffline({
  table: 'sales', operation: 'delete', id, payload: { id }, localRecord: null,
  request: () => remoteDeleteSale(id),
});

export const addSupplier = async (supplier) => {
  const id = supplier.id || createId();
  const payload = supplierPayload(supplier, id);
  return queueWhenOffline({
    table: 'suppliers', operation: 'add', id, payload, localRecord: supplierFromPayload(payload),
    request: () => remoteAddSupplier(payload),
  });
};

export const updateSupplier = async (id, supplier) => {
  const payload = supplierPayload(supplier, id);
  return queueWhenOffline({
    table: 'suppliers', operation: 'update', id, payload, localRecord: supplierFromPayload(payload),
    request: () => remoteUpdateSupplier(id, payload),
  });
};

export const deleteSupplier = (id) => queueWhenOffline({
  table: 'suppliers', operation: 'delete', id, payload: { id }, localRecord: null,
  request: () => remoteDeleteSupplier(id),
});
