import ThemeWrapper from "./wrappers/Theme";
import EditorScreen from "./views/Editor/Editor";

const App = () => {
  return (
    <ThemeWrapper themeName="default">
      <EditorScreen />
    </ThemeWrapper>
  );
};

export default App;
