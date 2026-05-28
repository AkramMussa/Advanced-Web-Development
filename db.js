// db.js

// Fire up Deno's built-in key-value database so data actually stays saved when the server reboots
export const kv = await Deno.openKv(); 

// Seed data: setting up initial courses so my student page isn't totally blank on first run
await kv.set(["programmes", 1], { id: 1, title: "BSc Cyber Security", level: "Undergraduate", description: "Learn to defend networks from modern threats.", published: true, leader: "Mr Clinton Ingrams" });
await kv.set(["programmes", 2], { id: 2, title: "MSc Advanced Web Development", level: "Postgraduate", description: "Master full-stack Deno framework architectures.", published: true, leader: "Dr Graeme Stuart" });

// Seed data: linking specific modules back to the courses using the progId property
await kv.set(["modules", 101], { id: 101, progId: 1, year: 1, name: "Intro to Security Operations", leader: "Mr Clinton Ingrams" });
await kv.set(["modules", 102], { id: 102, progId: 1, year: 2, name: "Network Infrastructure Defenses", leader: "Mr Clinton Ingrams" });
await kv.set(["modules", 103], { id: 103, progId: 2, year: 1, name: "Full-Stack System Architectures", leader: "Dr Graeme Stuart" });
await kv.set(["modules", 104], { id: 104, progId: 2, year: 1, name: "Asynchronous APIs & Security Protocols", leader: "Dr Graeme Stuart" });