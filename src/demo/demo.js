__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "staticRenderFns", function() { return staticRenderFns; });
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "div",
    [
      _c(
        "div",
        { staticClass: "detail-content" },
        [
          _c(
            "el-dialog",
            {
              attrs: { visible: _vm.detailsDialog, width: "60%" },
              on: {
                "update:visible": function($event) {
                  _vm.detailsDialog = $event
                },
                close: _vm.closeDetail
              }
            },
            [
              _c(
                "template",
                { slot: "title" },
                [
                  _c(
                    "el-col",
                    {
                      attrs: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 }
                    },
                    [
                      _c("div", { staticClass: "dialog-title" }, [
                        _c("span", [_vm._v("发货信息详情")]),
                        _c("span", {
                          staticClass: "el-icon-close",
                          on: {
                            click: function($event) {
                              _vm.detailsDialog = false
                            }
                          }
                        })
                      ])
                    ]
                  )
                ],
                1
              ),
              _c(
                "el-form",
                { attrs: { "label-width": "140px" } },
                [
                  _c(
                    "el-col",
                    {
                      attrs: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 }
                    },
                    [
                      _c("div", { staticClass: "tit-laber" }, [
                        _c("div", [
                          _c("img", {
                            staticClass: "subtitleIcon",
                            attrs: {
                              src: __webpack_require__(/*! @/assets/image/subtitleIcon.png */ "./src/assets/image/subtitleIcon.png")
                            }
                          }),
                          _c("span", [_vm._v("发货信息")])
                        ])
                      ])
                    ]
                  ),
                  _c(
                    "div",
                    {
                      directives: [
                        {
                          name: "loading",
                          rawName: "v-loading",
                          value: _vm.loading,
                          expression: "loading"
                        }
                      ]
                    },
                    [
                      _c(
                        "el-row",
                        { attrs: { gutter: 30 } },
                        [
                          _c(
                            "el-col",
                            {
                              attrs: { xs: 24, sm: 24, md: 12, lg: 12, xl: 12 }
                            },
                            [
                              _c(
                                "el-form-item",
                                { attrs: { label: "发货机构名称" } },
                                [_c("div", [_vm._v(_vm._s(_vm.name))])]
                              )
                            ],
                            1
                          ),
                          _vm._l(_vm.labelName, function(item, index) {
                            return _c(
                              "div",
                              { key: index },
                              [
                                _c(
                                  "el-col",
                                  {
                                    attrs: {
                                      xs: 24,
                                      sm: 24,
                                      md: 12,
                                      lg: 12,
                                      xl: 12
                                    }
                                  },
                                  [
                                    _c("el-form-item", [
                                      _c(
                                        "div",
                                        {
                                          attrs: { slot: "label" },
                                          slot: "label"
                                        },
                                        [_vm._v(_vm._s(item.label) + "：")]
                                      ),
                                      _c("div", [_vm._v(_vm._s(item.value))])
                                    ])
                                  ],
                                  1
                                )
                              ],
                              1
                            )
                          })
                        ],
                        2
                      )
                    ],
                    1
                  )
                ],
                1
              ),
              _c(
                "el-col",
                { attrs: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 } },
                [
                  _c("div", { staticClass: "tit-laber" }, [
                    _c("div", [
                      _c("img", {
                        staticClass: "subtitleIcon",
                        attrs: {
                          src: __webpack_require__(/*! @/assets/image/subtitleIcon.png */ "./src/assets/image/subtitleIcon.png")
                        }
                      }),
                      _c("span", [_vm._v("发货产品")])
                    ])
                  ])
                ]
              ),
              _c(
                "div",
                {
                  directives: [
                    {
                      name: "loading",
                      rawName: "v-loading",
                      value: _vm.loading,
                      expression: "loading"
                    }
                  ],
                  staticClass: "table_box"
                },
                [
                  [
                    _c(
                      "el-table",
                      {
                        directives: [
                          {
                            name: "loading",
                            rawName: "v-loading",
                            value: _vm.loadingShow,
                            expression: "loadingShow"
                          }
                        ],
                        attrs: {
                          "element-loading-text": "加载中...",
                          data: _vm.tableList,
                          stripe: "",
                          "header-row-class-name": _vm.headerStyle
                        }
                      },
                      [
                        _c("el-table-column", {
                          attrs: { label: "序号", type: "index", width: "55px" }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "productNameOrGenericName",
                            label: "产品名称",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "registrationOrFifingNumber",
                            width: "120",
                            label: "注册证号/备案号",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "versionOrModel",
                            label: "包装规格",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "licenseHoder",
                            label: "生产厂家",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "batch",
                            label: "生产批次号",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "productionDate",
                            label: "生产日期",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "deliveryQuantity",
                            label: "实际发货数",
                            "show-overflow-tooltip": ""
                          }
                        }),
                        _c("el-table-column", {
                          attrs: {
                            prop: "whetherUDI",
                            label: "UDI",
                            "show-overflow-tooltip": ""
                          }
                        })
                      ],
                      1
                    )
                  ]
                ],
                2
              )
            ],
            2
          )
        ],
        1
      ),
      _c("WhetherUDI", {
        ref: "whetherudi",
        attrs: { show: _vm.whetherudiDialog },
        on: { changwhether: _vm.changwhether }
      })
    ],
    1
  )
}
var staticRenderFns = []
render._withStripped = true



//# sourceURL=webpack:///./src/views/supervise/deliver_company/details.vue?./node_modules/cache-loader/dist/cjs.js?%7B%22cacheDirectory%22:%22node_modules/.cache/vue-loader%22,%22cacheIdentifier%22:%22f506f344-vue-loader-template%22%7D!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/vue-loader/lib??vue-loader-options