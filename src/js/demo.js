__webpack_require__.r(__webpack_exports__);
/* harmony import */ var I_JAVA_PROJECT_inspector_front_node_modules_babel_runtime_7_15_4_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/_@babel_runtime@7.15.4@@babel/runtime/helpers/esm/objectSpread2 */ "./node_modules/_@babel_runtime@7.15.4@@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core-js/modules/es.object.to-string.js */ "./node_modules/_core-js@3.6.5@core-js/modules/es.object.to-string.js");
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/utils/util */ "./src/utils/util.js");
/* harmony import */ var _utils_request__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/utils/request */ "./src/utils/request.js");
/* harmony import */ var _entrance_entrance_vue__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./entrance/entrance.vue */ "./src/views/authority/entrance/entrance.vue");


//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["default"] = ({
  components: {
    entrance: _entrance_entrance_vue__WEBPACK_IMPORTED_MODULE_4__["default"]
  },
  data: function data() {
    return {
      editDialog: false,
      form: {
        roleName: '',
        remark: ''
      },
      rules: {
        roleName: [{
          required: true,
          message: "请输入角色名",
          trigger: "blur"
        }]
      },
      unfold: false,
      // 展开 / 隐藏
      styleObj: {
        height: "50px",
        overflow: "hidden"
      },
      loadingShow: false,
      // 表格加载
      searchbtnLoad: false,
      // 搜索按钮加载
      id: "",
      // 详情id
      tableList: [],
      // table列表
      total: 0,
      // 列表总条数
      pageSizes: _utils_util__WEBPACK_IMPORTED_MODULE_2__["pageArr"],
      //   搜索条件
      searchs: {
        pageNum: 1,
        pageSize: 10
      },
      statusList: [{
        code: 0,
        name: '全部'
      }, {
        code: 1,
        name: '启用'
      }, {
        code: 2,
        name: '禁用'
      }],
      navList: [{
        name: "角色管理",
        id: 0,
        status: "-1"
      }, {
        name: "权限分配",
        id: 1,
        status: "1"
      }],
      currentTab: 0
    };
  },
  created: function created() {
    this.gettableList();
  },
  methods: {
    closeEdit: function closeEdit() {
      this.form = {
        roleName: '',
        remark: ''
      };
      this.$refs.ruleForm.resetFields();
    },
    submitForm: function submitForm(formName) {
      var _this = this;

      // 提交
      this.$refs[formName].validate(function (valid) {
        if (!valid) return;
        _this.loadingShow = true;
        _this.searchbtnLoad = true;
        Object(_utils_request__WEBPACK_IMPORTED_MODULE_3__["httpPost"])({
          url: "/role/system/edit",
          method: 'post',
          params: Object(I_JAVA_PROJECT_inspector_front_node_modules_babel_runtime_7_15_4_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({}, _this.form)
        }).then(function (res) {
          if (res.code === 200) {
            _this.editDialog = false;

            _this.gettableList();

            _this.$message.success('修改成功');
          }
        }).finally(function () {
          _this.loadingShow = false;
          _this.searchbtnLoad = false;
        });
      });
    },
    editFn: function editFn(row) {
      this.editDialog = true;
      var data = JSON.parse(JSON.stringify(row));
      this.form.roleName = data.roleName;
      this.form.remark = data.remark || '';
      this.form.roleId = data.roleId;
    },
    switchNav: function switchNav(t) {
      // 切换
      if (this.currentTab === 1 * t.currentTarget.dataset.id) return false;
      this.currentTab = 1 * t.currentTarget.dataset.id;
    },
    // 收起展开
    clickUnfold: function clickUnfold() {
      if (this.unfold) {
        // 收起
        this.styleObj = {
          height: "50px",
          overflow: "hidden"
        };
      } else {
        // 展开
        this.styleObj = {
          height: "auto"
        };
      }

      this.unfold = !this.unfold;
    },
    // 设置表头的背景
    headerStyle: function headerStyle(_ref) {
      var row = _ref.row,
          rowIndex = _ref.rowIndex;
      return "header_color";
    },
    // 获取列表
    gettableList: function gettableList() {
      var _this2 = this;

      this.loadingShow = true;

      var param = Object(I_JAVA_PROJECT_inspector_front_node_modules_babel_runtime_7_15_4_babel_runtime_helpers_esm_objectSpread2__WEBPACK_IMPORTED_MODULE_0__["default"])({}, this.searchs);

      Object(_utils_request__WEBPACK_IMPORTED_MODULE_3__["httpGet"])({
        url: "/role/system/list",
        method: 'get',
        params: param
      }).then(function (res) {
        if (res.code === 200) {
          _this2.tableList = res.data || []; // this.total = res.data.total
        }
      }).finally(function () {
        _this2.loadingShow = false;
        _this2.searchbtnLoad = false;
      });
    },
    // 每页的条数
    handleSizeChange: function handleSizeChange(val) {
      this.searchs.pageSize = val;
      this.gettableList();
    },
    // 分页
    handleCurrentChange: function handleCurrentChange(val) {
      this.searchs.pageNum = val;
      this.gettableList();
    },
    // 点击搜索按钮
    searchbtn: function searchbtn() {
      this.searchbtnLoad = true;
      this.searchs.pageNum = 1;
      this.gettableList();
    },
    // 点击清空条件
    emptys: function emptys() {
      for (var key in this.searchs) {
        this.searchs[key] = undefined;
      }

      this.searchs.pageNum = 1;
      this.searchs.pageSize = 10;
      this.gettableList();
    }
  }
});

//# sourceURL=webpack:///./src/views/authority/list.vue?./node_modules/_cache-loader@4.1.0@cache-loader/dist/cjs.js??ref--12-0!./node_modules/_babel-loader@8.2.3@babel-loader/lib!./node_modules/_cache-loader@4.1.0@cache-loader/dist/cjs.js??ref--0-0!./node_modules/_vue-loader@15.9.8@vue-loader/lib??vue-loader-options