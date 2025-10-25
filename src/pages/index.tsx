// 引入 React 的 useEffect 钩子，用于处理组件的副作用
import { useEffect } from "react";
// 引入 Next.js 的 dynamic 函数，用于实现组件的动态导入（代码分割）
import dynamic from "next/dynamic";
// 引入 Next.js 的 useRouter 钩子，用于访问路由信息和查询参数
import { useRouter } from "next/router";
// 引入 Mantine UI 库的色彩模式钩子，用于控制主题颜色
import { useMantineColorScheme } from "@mantine/core";
// 引入 Mantine Dropzone 组件的样式文件
import "@mantine/dropzone/styles.css";
// 引入 styled-components 的样式化组件和主题提供器
import styled, { ThemeProvider } from "styled-components";
// 引入 React Query 的客户端相关模块，用于数据获取和状态管理
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// 引入 Allotment 布局组件，用于创建可调整大小的面板布局
import { Allotment } from "allotment";
// 引入 Allotment 组件的默认样式
import "allotment/dist/style.css";
// 引入 Next SEO 组件，用于优化页面的搜索引擎优化（SEO）设置
import { NextSeo } from "next-seo";
// 从项目常量中引入 SEO 配置信息
import { SEO } from "../constants/seo";
// 从项目常量中引入暗色主题和亮色主题配置
import { darkTheme, lightTheme } from "../constants/theme";
// 从编辑器功能模块中引入底部工具栏组件
import { BottomBar } from "../features/editor/BottomBar";
// 从编辑器功能模块中引入全屏拖放区域组件
import { FullscreenDropzone } from "../features/editor/FullscreenDropzone";
// 从编辑器功能模块中引入工具栏组件
import { Toolbar } from "../features/editor/Toolbar";
// 从图形视图存储中引入自定义 hook，用于访问图形相关的状态
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
// 从配置存储中引入自定义 hook，用于访问应用配置状态
import useConfig from "../store/useConfig";
// 从文件存储中引入自定义 hook，用于访问文件相关状态
import useFile from "../store/useFile";

// 使用动态导入加载模态框控制器组件，仅在客户端渲染
const ModalController = dynamic(() => import("../features/modals/ModalController"));

// 使用动态导入加载外部模式组件，仅在客户端渲染
// const ExternalMode = dynamic(() => import("../features/editor/ExternalMode"));

// 创建 React Query 客户端实例并配置默认选项
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 禁用窗口聚焦时自动重新获取数据
      refetchOnWindowFocus: false,
      // 禁用查询失败时的自动重试
      retry: false,
    },
  },
});

// 定义页面包装器样式组件，设置为占满整个视口的弹性盒子布局
export const StyledPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;

  // 在超小屏幕设备上确保高度占满视口
  @media only screen and (max-width: 320px) {
    height: 100vh;
  }
`;

// 定义编辑器包装器样式组件，设置为占满父容器且隐藏溢出内容
export const StyledEditorWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

// 定义编辑器样式组件，基于 Allotment 组件进行定制
export const StyledEditor = styled(Allotment)`
  // 设置相对定位并标记为重要以覆盖默认样式
  position: relative !important;
  display: flex;
  // 使用主题变量设置背景色
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};

  // 在超小屏幕设备上设置高度占满视口
  @media only screen and (max-width: 320px) {
    height: 100vh;
  }
`;

// 定义文本编辑器包装器样式组件，设置为占满父容器的弹性盒子布局
const StyledTextEditor = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

// 使用动态导入加载文本编辑器组件，并禁用服务端渲染
const TextEditor = dynamic(() => import("../features/editor/TextEditor"), {
  ssr: false,
});

// 使用动态导入加载实时编辑器组件，并禁用服务端渲染
const LiveEditor = dynamic(() => import("../features/editor/LiveEditor"), {
  ssr: false,
});

// 定义编辑器页面的主要组件
const EditorPage = () => {
  // 获取 Next.js 路由对象的查询参数和准备状态
  const { query, isReady } = useRouter();

  // 获取 Mantine 主题颜色设置函数
  const { setColorScheme } = useMantineColorScheme();

  // 从文件存储中获取检查编辑器会话的函数
  const checkEditorSession = useFile(state => state.checkEditorSession);

  // 从配置存储中获取暗色模式启用状态
  const darkmodeEnabled = useConfig(state => state.darkmodeEnabled);

  console.log("EditorPage 渲染，暗色模式:", darkmodeEnabled);
  // 从图形存储中获取全屏状态
  const fullscreen = useGraph(state => state.fullscreen);

  // 副作用钩子：当路由准备就绪时检查编辑器会话状态
  useEffect(() => {
    if (isReady) checkEditorSession(query?.json);
  }, [checkEditorSession, isReady, query]);

  // 副作用钩子：根据暗色模式设置更新主题颜色方案
  useEffect(() => {
    setColorScheme(darkmodeEnabled ? "dark" : "light");
  }, [darkmodeEnabled, setColorScheme]);

  // 渲染组件内容
  return (
    <>
      {/*// 设置页面的 SEO 信息*/}
      <NextSeo
        {...SEO}
        title="Editor | JSON Crack"
        description="JSON Crack Editor is a tool for visualizing into graphs, analyzing, editing, formatting, querying, transforming and validating JSON, CSV, YAML, XML, and more."
        canonical="https://jsoncrack.com/editor"
      />

      {/*// 提供主题上下文给子组件*/}
      <ThemeProvider theme={darkmodeEnabled ? darkTheme : lightTheme}>
        {/*// 提供 React Query 客户端上下文给子组件*/}
        <QueryClientProvider client={queryClient}>
          {/*// 外部模式组件（当前被注释掉）*/}
          {/*<ExternalMode />*/}

          {/*// 渲染模态框控制器*/}
          <ModalController />

          {/*// 主编辑器包装器*/}
          <StyledEditorWrapper>
            {/*// 页面包装器*/}
            <StyledPageWrapper>
              {/*// 横幅组件（当前被注释掉）*/}
              {/*{process.env.NEXT_PUBLIC_DISABLE_EXTERNAL_MODE === "true" ? null : <Banner />}*/}
              {/*// 工具栏组件*/}
              <Toolbar />
              {/*// 内部编辑器包装器*/}
              <StyledEditorWrapper>
                {/*// 样式化的编辑器布局组件*/}
                <StyledEditor proportionalLayout={false}>
                  {/*// 左侧面板配置*/}
                  <Allotment.Pane
                    preferredSize={450}
                    minSize={fullscreen ? 0 : 300} // 全屏时最小尺寸为 0，否则为 300px
                    maxSize={800} // 最大尺寸为 800px
                    visible={!fullscreen}
                  >
                    {/*// 文本编辑器包装器*/}
                    <StyledTextEditor>
                      {/*// 文本编辑器组件*/}
                      <TextEditor />
                      {/*// 底部工具栏组件*/}
                      <BottomBar />
                    </StyledTextEditor>
                  </Allotment.Pane>
                  {/*// 右侧面板配置*/}
                  <Allotment.Pane minSize={0}>
                    {/*// 实时编辑器组件*/}
                    <LiveEditor />
                  </Allotment.Pane>
                </StyledEditor>
                {/*// 全屏拖放区域组件*/}
                <FullscreenDropzone />
              </StyledEditorWrapper>
            </StyledPageWrapper>
          </StyledEditorWrapper>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};

export default EditorPage;
