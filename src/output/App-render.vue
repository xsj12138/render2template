<template>
  <div>
    <div class="detail-content">
      <el-dialog :visible.sync="detailsDialog" width="60%" @close="closeDetail">
        <template slot="title">
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :xxl="24">
            <div class="dialog-title">
              <span> 发货信息详情 </span>
              <span class="el-icon-close" @click="($event) => detailsDialog = false">
              </span>
            </div>
          </el-col>
        </template>
        <el-form label-width="140px">
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :xxl="24">
            <div class="tit-laber">
              <div>
                <img class="subtitleIcon" :src="require('@/assets/image/subtitleIcon.png')" />
                <span> 发货信息 </span>
              </div>
            </div>
          </el-col>
          <div v-loading="loading">
            <el-row :gutter="30">
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-form-item label="发货机构名称">
                  <div>
                    {{ name }}
                  </div>
                </el-form-item>
              </el-col>
              <div :key="index" v-for="(item,index) in labelName">
                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                  <el-form-item>
                    <div slot="label">
                      {{ item.label }}：
                    </div>
                    <div>
                      {{ item.value }}
                    </div>
                  </el-form-item>
                </el-col>
              </div>
            </el-row>
          </div>
        </el-form>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :xxl="24">
          <div class="tit-laber">
            <div>
              <img class="subtitleIcon" :src="require('@/assets/image/subtitleIcon.png')" />
              <span> 发货产品 </span>
            </div>
          </div>
        </el-col>
        <div v-loading="loading" class="table_box">
          <el-table v-loading="loadingShow" element-loading-text="加载中..." :data="tableList" stripe :header-row-class-name="headerStyle">
            <el-table-column label="序号" type="index" width="55px">
            </el-table-column>
            <el-table-column prop="productNameOrGenericName" label="产品名称" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="registrationOrFifingNumber" width="120" label="注册证号/备案号" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="versionOrModel" label="包装规格" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="licenseHoder" label="生产厂家" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="batch" label="生产批次号" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="productionDate" label="生产日期" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="deliveryQuantity" label="实际发货数" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="whetherUDI" label="UDI" show-overflow-tooltip>
            </el-table-column>
          </el-table>
        </div>
      </el-dialog>
    </div>
    <WhetherUDI ref="whetherudi" :show="whetherudiDialog" @changwhether="changwhether">
    </WhetherUDI>
  </div>
</template>