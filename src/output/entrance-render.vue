<template>
  <div class="centent-box">
    <div class="query_head">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :xxl="24">
          <div class="tit-laber">
            <div>
              <img class="subtitleIcon" :src="require('@/assets/image/subtitleIcon.png')" />
              <span> 搜索查询 </span>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-form label-width="auto" :model="searchs">
        <div :style="styleObj">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="检查员姓名：">
                <el-input placeholder="单行输入" clearable v-model="searchs.userName">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="任务名称：">
                <el-input placeholder="单行输入" clearable v-model="searchs.taskName">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="任务编号：">
                <el-input placeholder="单行输入" clearable v-model="searchs.taskNo">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="考核得分范围：">
                <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" :xxl="12">
                  <el-input placeholder="单行输入" clearable v-model="searchs.startScore">
                  </el-input>
                </el-col>
                <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" :xxl="12">
                  <el-input placeholder="单行输入" clearable v-model="searchs.endScore">
                  </el-input>
                </el-col>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="检查企业">
                <el-input placeholder="请输入检查企业" clearable v-model="searchs.checkEnterprise">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="检查员类型：">
                <el-select clearable placeholder="请选择" v-model="searchs.inspType">
                  <el-option :key="item.id" :label="item.name" :value="item.id" v-for="item in inspectorList">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="检查日期范围：">
                <el-date-picker type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" clearable
                  @change="selectTime" v-model="searchs.daterange">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="8">
              <el-form-item label="检查方向：">
                <el-select clearable placeholder="请选择" v-model="searchs.direction">
                  <el-option :key="item.id" :label="item.name" :value="item.id" v-for="item in directionList">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div class="openSearch">
          <div class="search-button">
            <el-button class="submitbtn" type="primary" :loading="searchbtnLoad" @click="searchbtn"> 查询 </el-button>
            <el-button class="resetbtn" @click="emptys"> 重置 </el-button>
          </div>
          <div class="unfold-and-fold">
            <span @click="clickUnfold">
              <i v-show="!unfold" class="el-icon-arrow-down">
              </i>
              <i v-show="unfold" class="el-icon-arrow-up">
              </i>
              {{ unfold ? '收起' : '展开' }}
            </span>
          </div>
        </div>
      </el-form>
    </div>
    <div class="table_box">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :xxl="24">
          <div class="tit-laber">
            <div>
              <img class="subtitleIcon" :src="require('@/assets/image/subtitleIcon.png')" />
              <span> 已考核列表 </span>
            </div>
            <div class="operationBtn">
              <el-button type="text" :loading="searchbtnLoad" @click="exportFn">
                <img class="icon-add" :src="require('@/assets/image/export.png')" />
                <span> 导出 </span>
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-table v-loading="loadingShow" element-loading-text="加载中..." :data="tableList" stripe :header-cell-style="{ textAlign: 'center' }"
        :cell-style="{ textAlign: 'center' }" :header-row-class-name="headerStyle">
        <el-table-column label="序号" type="index" width="55px">
        </el-table-column>
        <el-table-column prop="userName" label="检查员名称">
        </el-table-column>
        <el-table-column prop="unitName" label="处室单位">
        </el-table-column>
        <el-table-column prop="deptName" label="所属科所">
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称">
          <template slot="default" slot-scope="scope">
            <el-button type="text" @click="($event) => toTask(scope.row)"
              v-if="userRoleAuthorities.indexOf('insp_inspector_supervise') >= 0 || userRoleAuthorities.indexOf('insp_central_leader') >= 0 || userRoleAuthorities.indexOf('insp_bureau_leader') >= 0">
              {{ scope.row.taskName }}
            </el-button>
            <span v-else>
              {{ scope.row.taskName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="taskNo" label="任务编号">
        </el-table-column>
        <el-table-column prop="checkEnterprise" label="检查企业">
        </el-table-column>
        <el-table-column prop="checkStartTime" label="检查日期起">
        </el-table-column>
        <el-table-column prop="checkEndTime" label="检查日期至">
        </el-table-column>
        <el-table-column prop="groupLeader" label="是否组长">
          <template slot="default" slot-scope="scope">
            {{ { 0: '否',   1: '是' }[scope.row.groupLeader] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="assessStatus" label="考核结果">
          <template slot="default" slot-scope="scope">
            {{ { 1: '待考核',   2: scope.row.score }[scope.row.assessStatus] || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="direction" label="检查方向">
          <template slot="default" slot-scope="scope">
            <span v-if="scope.row.direction == 0"> 其它 </span>
            <span v-else-if="scope.row.direction == 1"> 医疗器械 </span>
            <span v-else-if="scope.row.direction == 2"> 药品 </span>
            <span v-else-if="scope.row.direction == 3"> 化妆品 </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template slot="default" slot-scope="scope">
            <el-button type="text" @click="($event) => gowaitdetails(scope.row)"> 查看 </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="footer-pagin">
        <el-pagination :current-page="searchs.pageNum" :page-sizes="pageSizes" :pager-count="5" :page-size="searchs.pageSize"
          layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange">
        </el-pagination>
      </div>
    </div>
    <el-dialog title="提示" :visible="editDialog" width="400px" center @close="closeExamine">
      <div>
        <el-form ref="ruleForm" label-width="140px" :model="form" :rules="rules">
          <el-row class="form-body" :gutter="30">
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="请输入考核得分：" prop="score">
                <el-input v-model="form.score">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <el-form-item label="修改原因：" prop="remark">
                <el-input type="textarea" size="small" v-model="form.remark">
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <span class="dialog-footer" slot="footer">
        <el-button @click="($event) => editDialog = false"> 取 消 </el-button>
        <el-button type="primary" :loading="loadingShow" @click="($event) => submitForm('ruleForm')"> 确 定 </el-button>
      </span>
    </el-dialog>
    <Details ref="Details" :show="detailsDialog" :detailid="id" @typeChange="changeDetails">
    </Details>
  </div>
</template>