import { Component, ViewChild, AfterViewInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';

@Component({
  selector: 'app-record-rtc',
  templateUrl: './record-rtc.component.html',
  styleUrls: ['./record-rtc.component.css'],
})
export class RecordRtcComponent implements AfterViewInit {
  private stream: MediaStream;
  private recordRTC: any;

  @ViewChild('video') video;
  // tslint:disable-next-line: typedef
  ngAfterViewInit() {
    // set the initial state of the video
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = false;
    video.controls = true;
    video.autoplay = false;
  }

  // tslint:disable-next-line: typedef
  toggleControls() {
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = !video.muted;
    video.controls = !video.controls;
    video.autoplay = !video.autoplay;
  }

  // tslint:disable-next-line: typedef
  successCallback(stream: MediaStream) {
    const options = {
      mimeType: 'video/webm', // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 128000,
      bitsPerSecond: 128000, // if this line is provided, skip above two
    };
    this.stream = new MediaStream();
    this.recordRTC = RecordRTC(stream, options);
    this.recordRTC.startRecording();
    const video: HTMLVideoElement = this.video.nativeElement;
    video.srcObject = stream;
    this.toggleControls();
  }

  // tslint:disable-next-line: typedef
  errorCallback() {
    // handle error here
  }

  // tslint:disable-next-line: typedef
  processVideo(audioVideoWebMURL) {
    const video: HTMLVideoElement = this.video.nativeElement;
    const recordRTC = this.recordRTC;
    video.src = audioVideoWebMURL;
    this.toggleControls();
    const recordedBlob = recordRTC.getBlob();
    this.convertStreams(recordedBlob);
    recordRTC.getDataURL((dataURL) => {});
  }

  // tslint:disable-next-line: typedef
  startRecording() {
    const mediaConstraints = {
      video: true,
      audio: false,
    };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }

  // tslint:disable-next-line: typedef
  stopRecording() {
    const recordRTC = this.recordRTC;
    recordRTC.stopRecording(this.processVideo.bind(this));
    const stream = this.stream;
    stream.getAudioTracks().forEach((track) => track.stop());
    stream.getVideoTracks().forEach((track) => track.stop());
  }

  // tslint:disable-next-line: typedef
  convertStreams(videoBlob) {
    let filecontent;
    let worker;
    let workerReady;
    const fileReader = new FileReader();
    // tslint:disable-next-line: typedef
    fileReader.onload = function() {
      filecontent = this.result;

      worker.postMessage({
        type: 'command',
        arguments: '-i video.webm -c:v mpeg4 -b:v 6400k -strict experimental output.mp4'.split(
          ' '
        ),
        files: [
          {
            data: new Uint8Array(filecontent),
            name: 'video.webm',
          },
        ],
      });
    };
    fileReader.readAsArrayBuffer(videoBlob);
    if (typeof Worker !== 'undefined') {
      // Create a new
      const workerPath =
        'https://archive.org/download/ffmpeg_asm/ffmpeg_asm.js';
      const blob = URL.createObjectURL(
        new Blob(
          [
            'importScripts("' +
              workerPath +
              '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});',
          ],
          {
            type: 'application/javascript',
          }
        )
      );

      worker = new Worker(blob);
      URL.revokeObjectURL(blob);

      worker.onmessage = (event) => {
        const message = event.data;
        if (message.type === 'ready') {
          console.log(
            'file has been loaded.'
          );
          workerReady = true;
        } else if (message.type === 'stdout') {
          console.log(message.data);
        } else if (message.type === 'start') {
          console.log(
            'file received ffmpeg command.'
          );
        } else if (message.type === 'done') {
          const result = message.data[0];
          const filename = 'output.mp4';
          const outputblob = new File([result.data], 'test.mp4', {
            type: 'video/mp4',
          });

          if (window.navigator.msSaveOrOpenBlob) {
            // IE10+
            window.navigator.msSaveOrOpenBlob(outputblob, filename);
          } else {
            // Others
            const a = document.createElement('a');
            const url = URL.createObjectURL(outputblob);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 0);
          }
          this.recordRTC.save('video.webm');
        }
      };
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
  }
}
