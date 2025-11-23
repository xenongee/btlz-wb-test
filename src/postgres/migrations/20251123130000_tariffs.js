/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tariffs", (table) => {
        table.increments("id").primary();
        table.date("date").notNullable();
        table.string("warehouse_name").notNullable();
        table.string("geo_name");
        table.decimal("box_delivery_base", 10, 2);
        table.integer("box_delivery_coef_expr");
        table.decimal("box_delivery_liter", 10, 2);
        table.decimal("box_delivery_marketplace_base", 10, 2);
        table.integer("box_delivery_marketplace_coef_expr");
        table.decimal("box_delivery_marketplace_liter", 10, 2);
        table.decimal("box_storage_base", 10, 2);
        table.integer("box_storage_coef_expr");
        table.decimal("box_storage_liter", 10, 2);
        table.timestamps(true, true); // created_at, updated_at

        table.index(["date", "warehouse_name"]);
        table.index("box_delivery_coef_expr");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs");
}
