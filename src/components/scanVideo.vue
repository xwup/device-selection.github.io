<template>
  <div class="code-reader-content">
      <div class="page">
          <video ref="video" autoplay id="video"></video>
          <p v-if="videoInputDevicesArray.length == 0">{{ textContent }}</p>
      </div>
      <div class="scan-box">
          <div class="frame upper-left"></div>
          <div class="frame upper-right"></div>
          <div class="frame lower-right"></div>
          <div class="frame lower-left"></div>
          <div class="pointer-box">
              <div class="pointer"></div>
          </div>
          <div v-show="tipShow" class="tip">{{ tipMsg }}</div>
          <div class="btn-switch" @click="toggle"></div>
      </div>
  </div>
</template>

<script>
// 引入插件
import { BrowserMultiFormatReader } from '@zxing/library';

export default {
    name: 'scanVideo',
    data() {
        return {
            codeReader: null,
            tipMsg: '正在尝试识别....',
            tipShow: true,
            textContent: undefined,
            videoInputDevicesArray: [],
            deviceId: '',
            isEswitch: false,
            timer: null
        };
    },

    created() {
        this.openScan();

    },

    destroyed() {
        this.codeReader.stopContinuousDecode();
        this.codeReader.reset();
    },

    methods: {
        // 打开扫码
        async openScan() {
            this.codeReader = await new BrowserMultiFormatReader();
            this.codeReader
                .getVideoInputDevices()
                .then(async videoInputDevices => {
                    this.tipShow = true;
                    this.tipMsg = '正在尝试识别....';
                    this.videoInputDevicesArray = videoInputDevices;
                    //
                    console.log('获取到的摄像头',this.videoInputDevicesArray)
                    if (this.videoInputDevicesArray.length > 1) {
                        this.deviceId = this.videoInputDevicesArray[1].deviceId;
                    } else {
                        this.deviceId = this.videoInputDevicesArray[0].deviceId;
                    }
                    this.decodeFromInputVideoFunc();
                })
                .catch(() => {
                    this.tipShow = false;
                });
        },

        // 开始解码
        decodeFromInputVideoFunc() {
            if (this.videoInputDevicesArray.length == 0) {
                this.textContent = '初始化摄像头失败';
                document.getElementById('video').style.display = 'none';
                return;
            }
            this.codeReader.reset();
            this.codeReader.decodeFromInputVideoDeviceContinuously(this.deviceId, 'video', result => {
                this.tipMsg = '正在扫描';
                if (result) {
                    if (result.text) {
                        console.log('扫描成功',result)
                        this.tipMsg = '扫描成功';
                        this.tipShow = true;
                        window && window.getResultEvent(result)
                        window?.parent?.Gikam?.toast("扫码成功");
                        // 关闭扫码功能
                        this.codeReader.reset();
                        this.codeReader.stopContinuousDecode();

                    }
                }
            });
        },

        cutover() {
            if (this.videoInputDevicesArray && this.videoInputDevicesArray.length > 1) {
                if (this.deviceId === this.videoInputDevicesArray[0].deviceId) {
                    return (this.deviceId = this.videoInputDevicesArray[1].deviceId);
                } else {
                    return (this.deviceId = this.videoInputDevicesArray[0].deviceId);
                }
            }
            this.codeReader.stopStreams();
            return;
        },

        // 切换摄像头
        async toggle() {
            this.codeReader.stopStreams();
            this.timer = setTimeout(() => {
                this.timer = null;
            }, 2000);
            if (this.timer) {
                await this.codeReader.tryPlayVideo('video');
                this.cutover();
                this.decodeFromInputVideoFunc();
            }
        }
    }
};
</script>
