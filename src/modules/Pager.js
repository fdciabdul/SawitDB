const fs = require('fs');

const PAGE_SIZE = 4096;
const MAGIC = 'WOWO';

/**
 * Pager handles 4KB page I/O
 */
class Pager {
    constructor(filePath) {
        this.filePath = filePath;
        this.fd = null;
        this._open();
    }

    _open() {
        if (!fs.existsSync(this.filePath)) {
            this.fd = fs.openSync(this.filePath, 'w+');
            this._initNewFile();
        } else {
            this.fd = fs.openSync(this.filePath, 'r+');
        }
    }

    _initNewFile() {
        const buf = Buffer.alloc(PAGE_SIZE);
        buf.write(MAGIC, 0);
        buf.writeUInt32LE(1, 4); // Total Pages = 1
        buf.writeUInt32LE(0, 8); // Num Tables = 0
        fs.writeSync(this.fd, buf, 0, PAGE_SIZE, 0);
    }

    readPage(pageId) {
        const buf = Buffer.alloc(PAGE_SIZE);
        const offset = pageId * PAGE_SIZE;
        fs.readSync(this.fd, buf, 0, PAGE_SIZE, offset);
        return buf;
    }

    writePage(pageId, buf) {
        if (buf.length !== PAGE_SIZE) throw new Error("Buffer must be 4KB");
        const offset = pageId * PAGE_SIZE;
        fs.writeSync(this.fd, buf, 0, PAGE_SIZE, offset);
        // STABILITY UPGRADE: Force write to disk. 
        try { fs.fsyncSync(this.fd); } catch (e) { /* Ignore if not supported */ }
    }

    allocPage() {
        const page0 = this.readPage(0);
        const totalPages = page0.readUInt32LE(4);

        const newPageId = totalPages;
        const newTotal = totalPages + 1;

        page0.writeUInt32LE(newTotal, 4);
        this.writePage(0, page0);

        const newPage = Buffer.alloc(PAGE_SIZE);
        newPage.writeUInt32LE(0, 0); // Next Page = 0
        newPage.writeUInt16LE(0, 4); // Count = 0
        newPage.writeUInt16LE(8, 6); // Free Offset = 8
        this.writePage(newPageId, newPage);

        return newPageId;
    }
}

Pager.PAGE_SIZE = PAGE_SIZE;

module.exports = Pager;
