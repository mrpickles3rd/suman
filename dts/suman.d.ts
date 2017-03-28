

import EventEmitter = NodeJS.EventEmitter;





interface ISuman {

  numHooksSkipped: number,
  numHooksStubbed: number,
  describeOnlyIsTriggered: boolean,
  itOnlyIsTriggered: boolean,
  allDescribeBlocks: Array<ITestSuite>,
  interface: string,
  numBlocksSkipped: number,
  _sumanModulePath: string,
  logFinished: Function,
  _sumanEvents: EventEmitter,
  extraArgs: Array<string>

}


