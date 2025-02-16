declare module "shared-worker:*" {
  const SharedWorkerFactory: new () => SharedWorker;
  export default SharedWorkerFactory;
}

declare module "*.glsl" {
  const value: string;
  export default value;
}
