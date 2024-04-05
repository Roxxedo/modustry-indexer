import * as fs from 'fs'
import { env } from 'process';

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
    result: Server[];

    constructor() {
        this.lists = ["anuken/mindustry/master/servers_v7.json", "anuken/mindustry/master/servers_v6.json", "anuken/mindustry/master/servers_be.json"]
        this.result = []
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
    async main() {
        for (var url of this.lists) {
            var json: ServerParse[] = await this.query(this.makeUrl(url));
            console.log("SERVERS: Getting servers in " + url.replace("/master", "")) // Logging

            for (var item of json) {
                if (item.name) {
                    var id = item.name.toLowerCase().replace(/\s/g, '').replace(/[^a-zA-Z ]/g, '') // Simple name adaptation to work as ID
                    var server: Server = { id, name: item.name, icon: "", address: item.address, prioritized: (item.prioritized || false), modded: false, version: this.versionFromUrl(url) } // Modded has default value as false
                    this.result.push(server)
                }
            }
        }
        console.log("SERVERS: Final servers list done! Storing...") // Logging
    }
}

/* - - - MODS INDEXER - - - */
class ModsIndexer {
    blacklist: string[]
    nameBlacklist: string[];

    repositories: any[];
    result: any[];

    constructor() {
        this.blacklist = ["Snow-of-Spirit-Fox-Mori/old-mod", "TheSaus/Cumdustry", "Anuken/ExampleMod", "Anuken/ExampleJavaMod", "Anuken/ExampleKotlinMod", "Mesokrix/Vanilla-Upgraded", "RebornTrack970/Multiplayernt", "RebornTrack970/Multiplayerntnt", "RebornTrack970/Destroyer", "RebornTrack970/Mindustrynt", "NemesisTheory/killer", "TheDogOfChaos/reset-UUID-mindustry"]
        this.nameBlacklist = ["o7", "pixaxeofpixie", "Iron-Miner", "EasyPlaySu", "guiYMOUR", "mishakorzik"].map((x) => { return x.toLowerCase() })

        this.repositories = [];
        this.result = [];
    }

    async searchRepositories(): Promise<any[]> {
        const repositories: any[] = [];
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage) {
            const response = await fetch(`https://api.github.com/search/repositories?q=topic:mindustry-mod&per_page=100&page=${page}`, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': env.githubtoken
                }
            });
            if (response.ok) {
                const data: any = await response.json();
                repositories.push(...data.items);
                if (data.total_count > page * 100) page++;
                else hasNextPage = false;
            } else {
                hasNextPage = false;
                console.error('Error fetching data:', response.statusText);
                console.error(await response.json())
            }
        }
        return repositories
    }

    async main() {
        this.repositories = await this.searchRepositories().then((value) => { return value })
        this.result = this.repositories.filter((v) => { v["is_template"] == false })
        this.result = this.result.filter((v) => { this.blacklist.some((x) => { v["full_name"] !== x }) })
        this.result = this.result.filter((v) => { this.nameBlacklist.some((x) => { (v["full_name"] as string).startsWith(x) == false }) })
    }
}

/* - - - FILE SAVER - - - */
class FileSaver {
    saveFile(file: string, content: string) {
        console.log("Writing file " + file) // Logging
        fs.writeFileSync(file, content, 'utf8')
    }
}

/* - - - MAIN - - - */
async function main() {
    var fileSaver = new FileSaver();

    var mods = new ModsIndexer();
    var servers = new ServersIndexer();

    await mods.main().then(() => { fileSaver.saveFile("mods.json", JSON.stringify(mods.result)) })
    await servers.main().then(() => { fileSaver.saveFile("servers.json", JSON.stringify(servers.result)) })
}

main().then()
