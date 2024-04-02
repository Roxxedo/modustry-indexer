import * as fs from 'fs'

/* - - - SERVERS INDEXER - - - */

class ServerParse {
    name: string;
    address: string[];
    prioritized: boolean;

    constructor(name: string, address: string[], prioritized: boolean) {
        this.name = name;
        this.address = address;
        this.prioritized = prioritized || false
    }
}

interface Server {
    id: string;
    name: string;
    icon: string;
    address: string[];
    prioritized: boolean;
    modded: boolean;
    version: string;
}

class ServersIndexer {
    lists: string[];
    list: Server[];

    constructor() {
        this.lists = ["anuken/mindustry/master/servers_v7.json", "anuken/mindustry/master/servers_v6.json", "anuken/mindustry/master/servers_be.json"]
        this.list = []
    }

    async query<T>(url: string) {
        const req = await fetch(url);
        return (req.json()) as T;
    }

    makeUrl(url: string) {
        return "https://raw.githubusercontent.com/" + url
    }

    versionFromUrl(url: string) {
        if (url.endsWith("v7.json")) return "v7"; else
            if (url.endsWith("v6.json")) return "v6"; else
                if (url.endsWith("be.json")) return "be"; else return ""
    }

    // Get each item of official list and adapt for new format
    async getList() {
        for (var url of this.lists) {
            var json: ServerParse[] = await this.query(this.makeUrl(url));

            for (var item of json) {
                if (item.name) {
                    var id = item.name.toLowerCase().replace(/\s/g, '').replace(/[^a-zA-Z ]/g, '') // Simple name adaptation to work as ID
                    var server: Server = { id, name: item.name, icon: "", address: item.address, prioritized: (item.prioritized || false), modded: false, version: this.versionFromUrl(url) } // Modded has default value as false
                    this.list.push(server)
                }
            }
        }
    }
}

/* - - - FILE SAVER - - - */
class FileSaver {
    saveFile(file: string, content: string) {
        fs.writeFileSync(file, content, 'utf8')
    }
}

/* - - - MAIN - - - */
var fileSaver = new FileSaver();

var servers = new ServersIndexer()

servers.getList().then(() => { fileSaver.saveFile("servers.json", JSON.stringify(servers.list)) })
