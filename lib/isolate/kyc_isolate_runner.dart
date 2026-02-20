import 'dart:async';
import 'dart:isolate';

import 'package:flutter/services.dart';
import 'package:tuku/isolate/isolate.dart';
import 'package:tuku/models/models.dart';

class LimitedIsolateRunner{
  final int maxConcurrent;
  final _queue=<_IsolateJob>[]; // FIFO queue of jobs
  int _running=0; // count of current running isolates

  LimitedIsolateRunner({this.maxConcurrent=3});

  // runs an upload task & returns a kycModel
  Future<KycModel> runUploadTask({
    required String docType,
    required String filePath,
    required String fileType,
    required String fileExt,
    required String url,
    required RootIsolateToken isolateToken,
})async{
    final completer=Completer<KycModel>();
    _queue.add(_IsolateJob(completer,
        docType,filePath,
        fileType,fileExt,
        url,isolateToken));
    _processQueue(); // start processing queue items if possible
    return completer.future; // wait until the isolate send
  }

  void _processQueue()async{
    if(_running>=maxConcurrent||_queue.isEmpty)return;

    final job=_queue.removeAt(0);
    _running++;

    final receivePort=ReceivePort();
    await Isolate.spawn(uploadKycIsolate, [
      receivePort.sendPort,
      job.docType,
      job.filePath,
      job.fileType,
      job.fileExt,
      job.url,
      job.token
    ]);
    final result=await receivePort.first;
    job.completer.complete(result);
    _running--;
    _processQueue(); // process the next job (if any)
  }
}

class _IsolateJob{
  final Completer<KycModel> completer; // matches the isolate result back to caller
  final String docType;
  final String filePath;
  final String fileType;
  final String fileExt;
  final String url;
  final RootIsolateToken token;

  _IsolateJob(
      this.completer,
      this.docType,
      this.filePath,
      this.fileType,
      this.fileExt,
      this.url,
      this.token
      );
}