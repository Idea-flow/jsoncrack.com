import React, { useCallback } from "react";
import { LoadingOverlay } from "@mantine/core";
import styled from "styled-components";
import Editor, { type EditorProps, loader, type OnMount, useMonaco } from "@monaco-editor/react";
import useConfig from "../../store/useConfig";
import useFile from "../../store/useFile";

// 配置Monaco编辑器加载路径，使用CDN资源
loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
  },
});

// 定义编辑器选项配置
const editorOptions: EditorProps["options"] = {
  formatOnPaste: true, // 粘贴时自动格式化
  tabSize: 2, // 设置Tab大小为2个空格
  formatOnType: true, // 输入时自动格式化
  minimap: { enabled: false }, // 禁用小地图
  stickyScroll: { enabled: false }, // 禁用粘性滚动
  scrollBeyondLastLine: false, // 禁止滚动超过最后一行
  placeholder: "Start typing...", // 设置占位符文本
};

// 文本编辑器组件
const TextEditor = () => {
  const monaco = useMonaco(); // 获取Monaco实例
  const contents = useFile(state => state.contents); // 从状态管理中获取文件内容
  const setContents = useFile(state => state.setContents); // 从状态管理中获取设置文件内容的方法
  const setError = useFile(state => state.setError); // 从状态管理中获取设置错误信息的方法
  const jsonSchema = useFile(state => state.jsonSchema); // 从状态管理中获取JSON Schema
  const getHasChanges = useFile(state => state.getHasChanges); // 从状态管理中获取检查是否有更改的方法
  const theme = useConfig(state => (state.darkmodeEnabled ? "vs-dark" : "light")); // 根据配置确定主题
  const fileType = useFile(state => state.format); // 从状态管理中获取文件类型

  // 当jsonSchema或monaco实例变化时，更新JSON语言的诊断选项
  React.useEffect(() => {
    monaco?.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true, // 启用验证
      allowComments: true, // 允许注释
      enableSchemaRequest: true, // 启用Schema请求
      ...(jsonSchema && {
        schemas: [
          {
            uri: "http://myserver/foo-schema.json", // Schema URI
            fileMatch: ["*"], // 匹配所有文件
            schema: jsonSchema, // 使用的Schema
          },
        ],
      }),
    });
  }, [jsonSchema, monaco?.languages.json.jsonDefaults]);

  // 监听窗口卸载事件，当有未保存更改时提示用户
  React.useEffect(() => {
    const beforeunload = (e: BeforeUnloadEvent) => {
      if (getHasChanges()) {
        const confirmationMessage =
          "Unsaved changes, if you leave before saving  your changes will be lost"; // 确认消息

        (e || window.event).returnValue = confirmationMessage; // Gecko + IE浏览器兼容
        return confirmationMessage;
      }
    };

    window.addEventListener("beforeunload", beforeunload); // 添加事件监听器

    return () => {
      window.removeEventListener("beforeunload", beforeunload); // 清理事件监听器
    };
  }, [getHasChanges]);

  // 处理编辑器挂载事件
  const handleMount: OnMount = useCallback(editor => {
    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run(); // 粘贴后自动格式化文档
    });
  }, []);

  // 渲染编辑器组件
  return (
    <StyledEditorWrapper>
      <StyledWrapper>
        <Editor
          className="sentry-mask" // Sentry监控遮罩类名
          data-sentry-mask="true" // Sentry监控属性
          height="100%" // 设置高度为100%
          language={fileType} // 设置编辑器语言
          theme={theme} // 设置编辑器主题
          value={contents} // 设置编辑器内容
          options={editorOptions} // 设置编辑器选项
          onMount={handleMount} // 编辑器挂载回调
          onValidate={errors => setError(errors[0]?.message || "")} // 验证错误回调
          onChange={contents => setContents({ contents, skipUpdate: true })} // 内容变更回调
          loading={<LoadingOverlay visible />} // 加载状态显示
        />
      </StyledWrapper>
    </StyledEditorWrapper>
  );
};

export default TextEditor; // 导出TextEditor组件

// 样式化编辑器包装器组件
const StyledEditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
`;

// 样式化包装器组件
const StyledWrapper = styled.div`
  display: grid;
  height: 100%;
  grid-template-columns: 100%;
  grid-template-rows: minmax(0, 1fr);
`;
