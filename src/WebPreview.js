import { useMemo } from "react";

function WebPreview({ html, css, js }) {
  const documentContent = useMemo(
    () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (error) {
        const errorNode = document.createElement("pre");
        errorNode.style.color = "#ef4444";
        errorNode.style.padding = "12px";
        errorNode.textContent = error.message;
        document.body.appendChild(errorNode);
      }
    </script>
  </body>
</html>`,
    [css, html, js]
  );

  return (
    <iframe
      title="VoidLAB Preview"
      sandbox="allow-scripts"
      srcDoc={documentContent}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: "white",
      }}
    />
  );
}

export default WebPreview;
