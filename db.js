// db.js
// Open Deno's native, built-in key-value database for server-side persistence
export const kv = await Deno.openKv();

// Seed initial structural data if it doesn't exist yet
await kv.set(["programmes", 1], { id: 1, title: "BSc Cyber Security", level: "Undergraduate", description: "Learn to defend networks from modern threats.", published: true });
await kv.set(["programmes", 2], { id: 2, title: "MSc Advanced Web Development", level: "Postgraduate", description: "Master full-stack Deno framework architectures.", published: true });

await kv.set(["modules", 101], { id: 101, progId: 1, year: 1, name: "Intro to Security", leader: "Mr Clinton Ingrams" });
await kv.set(["modules", 102], { id: 102, progId: 2, year: 1, name: "Full-Stack Architecture", leader: "Dr Graeme Stuart" });