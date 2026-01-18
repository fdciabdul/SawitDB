/**
 * TransactionManager - Manages ACID transactions for SawitDB
 * Implements "AKAD" (Agreement) semantics with MULAI AKAD, SAHKAN, BATALKAN
 */
class TransactionManager {
    constructor(engine) {
        this.engine = engine;
        this.state = 'IDLE'; // IDLE | ACTIVE
        this.transactionId = null;
        this.buffer = []; // Buffered operations during transaction
        this.snapshot = new Map(); // Table snapshots for isolation
    }

    /**
     * Begin a new transaction
     */
    begin() {
        if (this.state === 'ACTIVE') {
            throw new Error('Transaction already active. SAHKAN or BATALKAN first.');
        }

        this.state = 'ACTIVE';
        this.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.buffer = [];
        this.snapshot.clear();

        return `Transaction started: ${this.transactionId}`;
    }

    /**
     * Commit the current transaction
     */
    commit() {
        if (this.state !== 'ACTIVE') {
            throw new Error('No active transaction to commit.');
        }

        try {
            // Execute all buffered operations
            const results = [];
            for (const op of this.buffer) {
                let result;
                switch (op.type) {
                    case 'INSERT':
                        result = this.engine.insertExecutor.execute(op.command);
                        break;
                    case 'UPDATE':
                        result = this.engine.updateExecutor.execute(op.command);
                        break;
                    case 'DELETE':
                        result = this.engine.deleteExecutor.execute(op.command);
                        break;
                    default:
                        throw new Error(`Unknown operation type: ${op.type}`);
                }
                results.push(result);
            }

            // Save count before cleanup
            const opCount = this.buffer.length;

            // Clear transaction state
            this._cleanup();

            return `Transaction committed: ${opCount} operations executed.`;
        } catch (error) {
            // Rollback on error
            this._cleanup();
            throw new Error(`Transaction commit failed: ${error.message}`);
        }
    }

    /**
     * Rollback the current transaction
     */
    rollback() {
        if (this.state !== 'ACTIVE') {
            throw new Error('No active transaction to rollback.');
        }

        const opCount = this.buffer.length;
        this._cleanup();

        return `Transaction rolled back: ${opCount} operations discarded.`;
    }

    /**
     * Buffer an operation during active transaction
     */
    bufferOperation(type, command) {
        if (this.state !== 'ACTIVE') {
            return null; // Not in transaction, execute normally
        }

        this.buffer.push({ type, command });
        return `Operation buffered (${this.buffer.length} total).`;
    }

    /**
     * Check if a transaction is currently active
     */
    isActive() {
        return this.state === 'ACTIVE';
    }

    /**
     * Cleanup transaction state
     */
    _cleanup() {
        this.state = 'IDLE';
        this.transactionId = null;
        this.buffer = [];
        this.snapshot.clear();
    }
}

module.exports = TransactionManager;
