const normalizePosRows = ({
  incomingRows = [],
  ownerId,
  sourceName = "Manual Upload",
  locationId = null,
  connectionId = null,
  externalIdType = null,
}) => {
  if (!ownerId || !Array.isArray(incomingRows)) {
    return [];
  }

  return incomingRows
    .map((row) => {
      const rawRecordGranularity =
  row.record_granularity ??
  row.recordGranularity ??
  row.sales_granularity ??
  row.salesGranularity ??
  null;

const normalizedRecordGranularity =
  rawRecordGranularity !== null &&
  rawRecordGranularity !== undefined
    ? String(rawRecordGranularity).trim().toLowerCase()
    : null;

const allowedRecordGranularities = [
  "daily_summary",
  "item_summary",
  "order",
  "line_item",
];

const hasExplicitGranularity =
  allowedRecordGranularities.includes(normalizedRecordGranularity);

const hasItemIdentity = [
  "name",
  "Name",
  "item_name",
  "Item Name",
  "menu_item",
  "Menu Item",
  "product",
  "Product",
  "item",
  "Item",
].some((key) => String(row[key] ?? "").trim() !== "");

const hasItemQuantity = [
  "quantity",
  "Quantity",
  "quantity_sold",
  "Quantity Sold",
  "qty_sold",
  "Qty Sold",
  "qty",
  "Qty",
].some((key) => String(row[key] ?? "").trim() !== "");

const hasDailySummaryStructure =
  !hasItemIdentity &&
  !hasItemQuantity &&
  !(
    row.transaction_id ||
    row.transactionId ||
    row.order_id ||
    row.orderId ||
    row.external_id ||
    row.externalId
  );

const hasSalesDate = [
  "sale_date",
  "saleDate",
  "business_date",
  "businessDate",
].some((key) => String(row[key] ?? "").trim() !== "");

const hasRevenue = [
  "revenue",
  "Revenue",
  "total_revenue",
  "totalRevenue",
].some((key) => String(row[key] ?? "").trim() !== "");

const hasTransactionIdentity = [
  "transaction_id",
  "transactionId",
  "order_id",
  "orderId",
  "external_id",
  "externalId",
  "check_id",
  "checkId",
  "ticket_id",
  "ticketId",
].some((key) => String(row[key] ?? "").trim() !== "");

const hasItemSummaryStructure =
  hasItemIdentity &&
  hasItemQuantity &&
  hasSalesDate &&
  hasRevenue &&
  !hasTransactionIdentity;

const hasValidLineItemStructure =
  hasItemIdentity &&
  hasItemQuantity &&
  hasSalesDate &&
  hasRevenue &&
  hasTransactionIdentity;

const recordGranularity =
  normalizedRecordGranularity === "line_item"
    ? hasValidLineItemStructure
      ? "line_item"
      : null
    : hasExplicitGranularity
    ? normalizedRecordGranularity
    : hasItemSummaryStructure
    ? "item_summary"
    : hasDailySummaryStructure && hasSalesDate && hasRevenue
    ? "daily_summary"
    : null;

// Never infer line_item from name and quantity alone.
// An item sales summary may contain those same fields.
//
// Unknown records remain unclassified until their
// source and measurement granularity are confirmed.
      const rawLineItemId =
  row.line_item_id ||
  row.lineItemId ||
  row.order_item_id ||
  row.orderItemId ||
  null;

const rawExternalId =
  recordGranularity === "line_item"
    ? rawLineItemId ||
      row.external_id ||
      row.externalId ||
      null
    : rawLineItemId ||
      row.external_id ||
      row.externalId ||
      row.transaction_id ||
      row.transactionId ||
      row.order_id ||
      row.orderId ||
      row.check_id ||
      row.checkId ||
      row.ticket_id ||
      row.ticketId ||
      null;

const rawExternalIdType =
  rawLineItemId
    ? "line_item"
    : row.external_id_type ||
      row.externalIdType ||
      externalIdType ||
      null;
  const rawProviderUpdatedAt =
  row.provider_updated_at ||
  row.providerUpdatedAt ||
  row.updated_at ||
  row.updatedAt ||
  row.modified_at ||
  row.modifiedAt ||
  row.last_modified_at ||
  row.lastModifiedAt ||
  null;
const rawProviderStatus =
  row.provider_status ||
  row.providerStatus ||
  row.status ||
  row.order_status ||
  row.orderStatus ||
  row.payment_status ||
  row.paymentStatus ||
  null;

const normalizedProviderStatus = rawProviderStatus
  ? String(rawProviderStatus).trim().toLowerCase()
  : null;

const rawIsVoided =
  row.is_voided ??
  row.isVoided ??
  row.voided ??
  row.is_canceled ??
  row.isCanceled ??
  row.canceled ??
  row.cancelled ??
  null;

const statusIndicatesVoid = [
  "void",
  "voided",
  "cancelled",
  "canceled",
].includes(normalizedProviderStatus);

const hasExplicitVoidSignal =
  rawIsVoided !== null &&
  rawIsVoided !== undefined &&
  String(rawIsVoided).trim() !== "";

const explicitVoidValue =
  rawIsVoided === true ||
  String(rawIsVoided).toLowerCase() === "true" ||
  String(rawIsVoided) === "1";

const isVoided =
  statusIndicatesVoid
    ? true
    : hasExplicitVoidSignal
    ? explicitVoidValue
    : null;

const rawProviderDeletedAt =
  row.provider_deleted_at ||
  row.providerDeletedAt ||
  row.deleted_at ||
  row.deletedAt ||
  null;

const parsedProviderDeletedAt = rawProviderDeletedAt
  ? new Date(rawProviderDeletedAt)
  : null;

const providerDeletedAt =
  parsedProviderDeletedAt &&
  !Number.isNaN(parsedProviderDeletedAt.getTime())
    ? parsedProviderDeletedAt.toISOString()
    : null;
const parsedProviderUpdatedAt = rawProviderUpdatedAt
  ? new Date(rawProviderUpdatedAt)
  : null;

const providerUpdatedAt =
  parsedProviderUpdatedAt &&
  !Number.isNaN(parsedProviderUpdatedAt.getTime())
    ? parsedProviderUpdatedAt.toISOString()
    : null;
      const rawDate =
  row.sale_date ??
  row.saleDate ??
  row.business_date ??
  row.businessDate ??
  row.date ??
  row.Date ??
  row["Sale Date"] ??
  row["Business Date"] ??
  row.day ??
  row.Day ??
  null;

      const rawRevenue =
  row.revenue ??
  row.Revenue ??
  row.sales ??
  row.Sales ??
  row.total_sales ??
  row.totalSales ??
  row["Total Sales"] ??
  row.net_sales ??
  row.netSales ??
  row["Net Sales"] ??
  row.gross_sales ??
  row.grossSales ??
  row["Gross Sales"] ??
  row.amount ??
  row.Amount ??
  row.total ??
  row.Total ??
  0;

      const rawOrders =
        row.orders_count ||
        row.ordersCount ||
        row.orders ||
        row.Orders ||
        row.order_count ||
        row["Order Count"] ||
        row.check_count ||
        row["Check Count"] ||
        row.ticket_count ||
        row["Ticket Count"] ||
        row.transactions ||
        row.Transactions ||
        row["Guest Count"] ||
        row.guests ||
        row.Guests ||
        0;

      const rawLabor =
        row.labor ??
        row.labor_cost ??
        row.Labor ??
        row["Labor Cost"] ??
        row.total_labor ??
        row.total_labor_cost ??
        row["Total Labor"] ??
        row["Total Labor Cost"] ??
        row.payroll ??
        row.Payroll ??
        row.wages ??
        row.Wages ??
        row.total_pay ??
        row["Total Pay"] ??
        row.gross_pay ??
        row["Gross Pay"] ??
        0;

      const rawName =
        row.name ||
        row.Name ||
        row.item ||
        row.Item ||
        row.item_name ||
        row["Item Name"] ||
        row.menu_item ||
        row["Menu Item"] ||
        row.product ||
        row.Product ||
        null;

        const rawCategory =
  row.category ??
  row.Category ??
  row.item_category ??
  row.itemCategory ??
  row["Item Category"] ??
  row.menu_category ??
  row.menuCategory ??
  row["Menu Category"] ??
  row.product_category ??
  row["Product Category"] ??
  null;

      const rawQuantity =
        row.quantity ??
        row.Quantity ??
        row.quantity_sold ??
        row["Quantity Sold"] ??
        row.qty_sold ??
        row["Qty Sold"] ??
        row.qty ??
        row.Qty ??
        0;

      const rawShift =
        row.shift ||
        row.Shift ||
        row.daypart ||
        row.Daypart ||
        row["Day Part"] ||
        row.meal_period ||
        row["Meal Period"] ||
        row.service_period ||
        row["Service Period"] ||
        "";

      const rawTime =
        row.time ||
        row.Time ||
        row.order_time ||
        row["Order Time"] ||
        row.check_time ||
        row["Check Time"] ||
        row.closed_time ||
        row["Closed Time"] ||
        row.opened_time ||
        row["Opened Time"] ||
        row.hour ||
        row.Hour ||
        "";

      const rawLocation =
        row.location ||
        row.Location ||
        row.store ||
        row.Store ||
        row.restaurant ||
        row.Restaurant ||
        row.location_name ||
        row["Location Name"] ||
        null;
// Preserve explicit test-data classification from POS imports.
// CSV parsers commonly return booleans as strings.
const rawIsTestData =
  row.is_test_data ??
  row.isTestData ??
  row["Is Test Data"] ??
  null;

const isTestData =
  rawIsTestData === true ||
  String(rawIsTestData ?? "").trim().toLowerCase() === "true" ||
  String(rawIsTestData ?? "").trim() === "1";
     const parsedDate = rawDate ? new Date(rawDate) : null;

const providedFields = {
  record_granularity:
    [
      "record_granularity",
      "recordGranularity",
      "sales_granularity",
      "salesGranularity",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  sale_date:
    rawDate !== null &&
    rawDate !== undefined &&
    String(rawDate).trim() !== "",

  revenue:
    [
      "revenue",
      "Revenue",
      "sales",
      "Sales",
      "total_sales",
      "totalSales",
      "Total Sales",
      "net_sales",
      "netSales",
      "Net Sales",
      "gross_sales",
      "grossSales",
      "Gross Sales",
      "amount",
      "Amount",
      "total",
      "Total",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  orders_count:
    [
      "orders_count",
      "ordersCount",
      "orders",
      "Orders",
      "order_count",
      "Order Count",
      "check_count",
      "Check Count",
      "ticket_count",
      "Ticket Count",
      "transactions",
      "Transactions",
      "Guest Count",
      "guests",
      "Guests",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  labor:
    [
      "labor",
      "labor_cost",
      "Labor",
      "Labor Cost",
      "total_labor",
      "total_labor_cost",
      "Total Labor",
      "Total Labor Cost",
      "payroll",
      "Payroll",
      "wages",
      "Wages",
      "total_pay",
      "Total Pay",
      "gross_pay",
      "Gross Pay",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  name:
    [
      "name",
      "Name",
      "item",
      "Item",
      "item_name",
      "Item Name",
      "menu_item",
      "Menu Item",
      "product",
      "Product",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

      category:
    [
      "category",
      "Category",
      "item_category",
      "itemCategory",
      "Item Category",
      "menu_category",
      "menuCategory",
      "Menu Category",
      "product_category",
      "Product Category",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  quantity:
    [
      "quantity",
      "Quantity",
      "quantity_sold",
      "Quantity Sold",
      "qty_sold",
      "Qty Sold",
      "qty",
      "Qty",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  shift:
    [
      "shift",
      "Shift",
      "daypart",
      "Daypart",
      "Day Part",
      "meal_period",
      "Meal Period",
      "service_period",
      "Service Period",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  order_time:
    [
      "time",
      "Time",
      "order_time",
      "Order Time",
      "check_time",
      "Check Time",
      "closed_time",
      "Closed Time",
      "opened_time",
      "Opened Time",
      "hour",
      "Hour",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),

  location_name:
    [
      "location",
      "Location",
      "store",
      "Store",
      "restaurant",
      "Restaurant",
      "location_name",
      "Location Name",
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(row, key)
    ),
};

return {
        user_id: ownerId,

        sale_date:
          parsedDate &&
          !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toISOString().slice(0, 10)
            : null,

        revenue: Number(
          String(rawRevenue).replace(/[$,]/g, "") || 0
        ),

        orders_count: Number(
          String(rawOrders).replace(/[,]/g, "") || 0
        ),

        labor: Number(
          String(rawLabor).replace(/[$,]/g, "") || 0
        ),
        record_granularity: recordGranularity,
        is_test_data: isTestData,
name: rawName,

category:

  rawCategory !== null &&
  String(rawCategory).trim() !== ""
    ? String(rawCategory).trim()
    : null,

quantity: Number(
  String(rawQuantity).replace(/[,]/g, "") || 0
),

        shift: rawShift || null,
        order_time: rawTime || null,
        location_name: rawLocation,

      source_name: sourceName || "Manual Upload",
location_id: locationId || null,
connection_id: connectionId || null,

external_id:
  rawExternalId !== null &&
  rawExternalId !== undefined &&
  String(rawExternalId).trim() !== ""
    ? String(rawExternalId).trim()
    : null,

external_id_type:
  rawExternalIdType !== null &&
  rawExternalIdType !== undefined &&
  String(rawExternalIdType).trim() !== ""
    ? String(rawExternalIdType).trim()
    : null,

provider_updated_at: providerUpdatedAt,
provider_status: normalizedProviderStatus,
is_voided: isVoided,
provider_deleted_at: providerDeletedAt,

_provided_fields: providedFields,
};
    }).filter((row) => {
  const hasValidSaleDate = Boolean(row.sale_date);
  const hasFiniteRevenue = Number.isFinite(row.revenue);

  const hasProviderIdentity =
    Boolean(row.connection_id) &&
    Boolean(row.external_id);

  const isProviderLifecycleRow =
    hasProviderIdentity &&
    (
      row.is_voided === true ||
      Boolean(row.provider_deleted_at)
    );

  const isValidOperationalSale =
    hasValidSaleDate &&
    hasFiniteRevenue &&
    row.revenue > 0;

  return (
    isValidOperationalSale ||
    isProviderLifecycleRow
  );
});
};

export { normalizePosRows };

