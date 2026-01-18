/**
 * ViewManager - Manages Virtual Views (TEROPONG) for SawitDB
 * Views are stored queries that can be queried like tables
 */
class ViewManager {
    constructor(engine) {
        this.engine = engine;
        this.views = new Map(); // viewName -> { query, definition }
    }

    /**
     * Create a new view
     * @param {string} viewName - Name of the view
     * @param {object} selectCommand - Parsed SELECT command
     */
    createView(viewName, selectCommand) {
        if (this.views.has(viewName)) {
            throw new Error(`View '${viewName}' already exists.`);
        }

        // Validate that it's a SELECT command
        if (selectCommand.type !== 'SELECT') {
            throw new Error('Views can only be created from SELECT queries.');
        }

        // Store view definition
        this.views.set(viewName, {
            query: selectCommand,
            createdAt: new Date().toISOString()
        });

        // Persist to system table
        this._persistView(viewName, selectCommand);

        return `View '${viewName}' created successfully.`;
    }

    /**
     * Drop a view
     */
    dropView(viewName) {
        if (!this.views.has(viewName)) {
            throw new Error(`View '${viewName}' does not exist.`);
        }

        this.views.delete(viewName);
        this._removeViewFromSystem(viewName);

        return `View '${viewName}' dropped.`;
    }

    /**
     * Execute a view (run the stored query)
     */
    executeView(viewName, additionalCriteria = null) {
        if (!this.views.has(viewName)) {
            throw new Error(`View '${viewName}' does not exist.`);
        }

        const viewDef = this.views.get(viewName);
        const cmd = { ...viewDef.query };

        // Optionally merge additional criteria
        if (additionalCriteria) {
            if (cmd.criteria) {
                cmd.criteria = {
                    type: 'compound',
                    logic: 'AND',
                    conditions: [cmd.criteria, additionalCriteria]
                };
            } else {
                cmd.criteria = additionalCriteria;
            }
        }

        return this.engine.selectExecutor.execute(cmd);
    }

    /**
     * List all views
     */
    listViews() {
        const viewList = [];
        for (const [name, def] of this.views) {
            viewList.push({
                name,
                createdAt: def.createdAt
            });
        }
        return viewList;
    }

    /**
     * Check if a name is a view
     */
    isView(name) {
        return this.views.has(name);
    }

    /**
     * Load views from system table
     */
    loadViews() {
        const viewsTable = this.engine.tableManager.findTableEntry('_views');
        if (!viewsTable) return;

        const rows = this.engine._scanTable(viewsTable, null);
        for (const row of rows) {
            try {
                const query = JSON.parse(row.definition);
                this.views.set(row.name, {
                    query,
                    createdAt: row.createdAt
                });
            } catch (e) {
                console.error(`Failed to load view '${row.name}':`, e.message);
            }
        }
    }

    /**
     * Persist view to system table
     */
    _persistView(viewName, selectCommand) {
        // Ensure _views table exists
        if (!this.engine.tableManager.findTableEntry('_views')) {
            this.engine.tableManager.createTable('_views', true);
        }

        const viewData = {
            name: viewName,
            definition: JSON.stringify(selectCommand),
            createdAt: new Date().toISOString()
        };

        this.engine.insertExecutor.execute({
            type: 'INSERT',
            table: '_views',
            data: viewData
        });
    }

    /**
     * Remove view from system table
     */
    _removeViewFromSystem(viewName) {
        this.engine.deleteExecutor.execute({
            type: 'DELETE',
            table: '_views',
            criteria: { key: 'name', op: '=', val: viewName }
        });
    }
}

module.exports = ViewManager;
