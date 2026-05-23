export const CREATE_PRODUCT_TOPIC_NAME = "createProductTopic";

/** SNS message attribute names (must match subscription filter policies). */
export const SNS_PRODUCT_ATTR_PRICE = "price";
export const SNS_PRODUCT_ATTR_COUNT = "count";
export const SNS_PRODUCT_ATTR_TITLE = "title";

/** Products with price >= this value go to the high-price email subscription. */
export const HIGH_PRICE_THRESHOLD = 50;

/** Products with count < this value go to the low-stock email subscription. */
export const LOW_STOCK_THRESHOLD = 10;
