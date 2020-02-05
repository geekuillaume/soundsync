export function destructuredPromise<T>(): [Promise<T>, (res?: T) => any, (e: any) => any] {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return [promise, resolve, reject] as [Promise<any>, () => any, () => any];
}
