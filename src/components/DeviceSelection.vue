<template>

  <v-sheet class="mx-auto" width="300">
    <h1 class="my-4">机房信息登记</h1>
    <v-snackbar :timeout="3000" v-model="messageBox" :color="snackColor">
      {{ messageText }}

      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="messageBox = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-form @submit.prevent="handleRecord">
      <v-container width="100%">
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="building" :rules="buildingRules" label="楼栋号"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="room" :rules="roomRules" label="房间号"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="cabinet" :rules="cabinetRules" label="机柜"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="deviceLayer" :rules="deviceLayerRules" label="设备所在层(U)"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px; width: 80%; flex-basis:auto;">
            <v-text-field v-model="assetNumber" label="资产编号"></v-text-field>
          </v-col>
          <v-col style="padding: 0px; width: 20%; flex-basis:auto;">
            <v-btn class="text-none mb-4" color="indigo-darken-3" @click="scanBarcode">拍照
              <v-overlay activator="parent" location-strategy="connected" scroll-strategy="block">
                <v-sheet elevation="6" height="80%" width="80%" border>
                  <video ref="video" autoplay id="video" width="100%"></video>
                </v-sheet>
              </v-overlay>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <div class="d-flex justify-space-between mt-2">
        <v-btn @click="exportExcel" class="text-none mb-4" color="grey-lighten-3" size="x-large"
          variant="flat">导出</v-btn>
        <v-btn class="text-none mb-4" color="indigo-darken-3" size="x-large" variant="flat" type="submit">录入</v-btn>

      </div>
    </v-form>
  </v-sheet>
</template>

<script>
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import { BrowserMultiFormatReader } from '@zxing/library';

export default {
  setup() {
    const building = ref('');
    const room = ref('');
    const cabinet = ref('');
    const deviceLayer = ref('');
    const assetNumber = ref('');
    const messageBox = ref(false);
    const messageText = ref('');
    const snackColor = ref('');

    // 存储录入的数据
    const recordedData = ref([]);

    const successAlert = "#4CAF50"
    const errorAlert = "#F44336"


    // 规则定义
    const buildingRules = [
      value => {
        if (value && value.length === 1 && value.match(/[A-Za-z]/)) {
          building.value = value.toUpperCase();
          return true;
        }

        return '楼栋号必须是单个大写字母';
      },
    ];

    const roomRules = [
      value => {
        if (value && value.match(/^\d+$/)) {
          return true;
        }

        return '房间号只能是数字';
      },
    ];

    const cabinetRules = [
      value => {
        if (value && value.match(/^[A-Za-z]+\d+$/)) {
          cabinet.value = value.toUpperCase();
          return true;
        }

        return '机柜必须是大写字母加数字组合';
      },
    ];

    const deviceLayerRules = [
      value => {
        if (value && value.match(/^\d+(-\d+)?$/)) {
          return true;
        }

        return '设备所在层只能是数字或数字-数字';
      },
    ];

    // const assetNumberRules = [
    //   value => {
    //     if (value || value.match(/^[a-zA-Z0-9]+$/)) {
    //       return true;
    //     }

    //     return '资产编号只能是字母和数字组合';
    //   },
    // ];

    const messageAlert = (text, type) => {
      messageBox.value = true;
      messageText.value = text;
      snackColor.value = type;
    }
    const isBoolean = (value) => {
      return typeof value === 'boolean';
    }
    // 录入数据
    const handleRecord = () => {
      if (!isBoolean(buildingRules[0](building.value)) ||
        !isBoolean(roomRules[0](room.value)) ||
        !isBoolean(cabinetRules[0](cabinet.value)) ||
        !isBoolean(deviceLayerRules[0](deviceLayer.value))) {
        messageAlert('请检查所有输入项是否符合要求', errorAlert);
        return;
      }
      const defaultAssetNumber = `${building.value}${room.value}-${cabinet.value}-${deviceLayer.value}无资产编号`;
      const newData = {
        building: building.value,
        room: room.value,
        cabinet: cabinet.value,
        deviceLayer: deviceLayer.value,
        assetNumber: assetNumber.value || defaultAssetNumber
      };

      // 检查资产编号是否重复
      const isDuplicate = recordedData.value.some(record => record.assetNumber === newData.assetNumber);
      if (isDuplicate) {
        messageAlert('已存在重复资产', errorAlert);
        return;
      }

      recordedData.value.push(newData);
      messageAlert('录入成功', successAlert);
      console.log('Recorded Data:', recordedData.value);

      // 不再清空输入框
    };

    // 导出 Excel
    const exportExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(recordedData.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, '机房设备信息.xlsx');
    };

    // 扫描条形码
    const scanBarcode = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        const result = await reader.decodeFromVideoDevice(undefined, 'video');
        assetNumber.value = result.text;
        messageAlert('扫描成功', successAlert);
      } catch (error) {
        messageAlert('扫描失败，请重试', errorAlert);
      }
    };

    return {
      building,
      messageBox,
      messageText,
      snackColor,
      room,
      cabinet,
      deviceLayer,
      assetNumber,
      buildingRules,
      roomRules,
      cabinetRules,
      deviceLayerRules,
      handleRecord,
      exportExcel,
      scanBarcode,
    };
  },
};

</script>
