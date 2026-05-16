
import { NextFunction, Request,Response } from "express";
import path from 'path';
import {createContainer,stopContainer} from './services/docker.service';
import { error } from "console";
//Good to know that serverRouter is a fuckass name that I decided on 
//since the default export of server.routes is router and is alone type shit
import serverRouter from "./routes/server.routes";

import Docker, { Container } from 'dockerode';
const docker = new Docker();
const express = require('express');
const morgan = require('morgan');

const app = express();

// listen for requests 
app.listen(3000);

// middleware and static files 
// here we say to the browser that the files in this folder called
// "public" are accessible (goooon)
app.use(express.static('public'));
app.use(express.json()); // since we will not be parsing html (cuz vite) we only want to parse post requests that are json
app.use(morgan('dev')); // third party middleware

app.use("/api/server",serverRouter);




// app.use((req:Request, res:Request, next:NextFunction) =>{
//     // console.log(`New request made: \nhost: ${req.hostname} \npath: ${req.path} \nmethod: ${req.method}`)
//     console.log(`Listening on port 3000 for npm dev`);
//     next();
// });

// // does it match? send response and end else go next
// app.get('/',(req:Request,res:Response) =>{
//     // res.send('<p> home page </p>');
//     res.sendFile(path.join(__dirname,'../../frontend/dist/index.html'));
// });

// app.post('/server',);


// app.get('/server/:id/stop', async (req:Request,res:Response) => {
//     await stopContainerTest(req.params.id);
//     res.status(204).send;

// });
// async function stopContainerTest(containerId: string): Promise<void> {
//   try {
//     const container: Container = docker.getContainer(containerId);
//     await container.stop();
//     console.log(`Container stopped ${containerId}`);
//   } catch (err: unknown) {
//     if (err instanceof Error && 'statusCode' in err) {
//       const code = (err as Error & { statusCode: number }).statusCode;
//       if (code === 304) { console.log('Container already stopped'); return; }
//       if (code === 404) { console.log('Container not found');       return; }
//     }
//     throw err;
// }}
// // does it match? send response and else go next
// // and so on
// app.get('/about',(req:Request,res:Response) =>{
//     // redirects into the root (forces)
//     res.redirect('/');
// });


// // Posting: when someone wants to post smt, the req.body will be undefined if you
// // don't do app.use(express.json()); this tell the express app to parse incoming json to
// // the req.body
// app.post('/posttest', (req:Request,res:Response) => {
//     console.log(req.body);
//     res.json({"name": req.body.name});
// });

// app.post('/imagetest', async (req:Request,res:Response) =>{
//     try{
//         const image:string = req.body.image;
//         //since it's an async function we need to make the callback function async
//         // and only then can we parse the promise to a string
//         const containerId:string = await createContainer(image);
//         console.log(`created this container: ${containerId}`);
//         res.status(204).json({containerId : `${containerId}`});
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({error: "Something gone wrong"});
//     }
// })

// // Route parameters: variable parts of the route that may change value
// app.get('/test/:id', (req:Request, res:Response) => {
//     const id:string = req.params.id;
//     console.log(id);
//     res.status(204).send(); // success nothing to send back
// });

// // For multiple ids, you can just add more slashes and express only matches the exact structure of the url
// app.get('/test/:id/:goon', (req:Request,res:Response) => {
//     const id:string = req.params.id;
//     const goon:string = req.params.goon;
//     console.log(id);
//     console.log(goon);
//     res.status(204).send(); // success nothing to send back
// });


// // Now to delete, you can use the same route, just the methode that changes
// app.delete('test/:id', (req:Request,res:Response) => {
//     const id:string = req.params.id;
//     //delete wtv
//     res.status(204).send();
// });


// // The use function will fire for every request coming in
// // but only if the request reaches that point in the code
// // it's not scoped out to a specific url and it's position is important
// app.use((req:Request, res: Response) => {
//     console.log(`404 triggered for: ${req.method} ${req.path}`);
//     res.status(404).send("Route not found");
// });