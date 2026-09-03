import start_server from "./server.js";

start_server().catch((error) => {
    console.error('Error starting backend:', error);
    process.exit(1);
});