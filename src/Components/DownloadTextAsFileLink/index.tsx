import React, { FunctionComponent } from "react";

type DownloadTextAsFileProps = {
  text: string;
  fileName: string;
  label?: string;
};

const DownloadTextAsFileLink: FunctionComponent<DownloadTextAsFileProps> = ({
  text,
  fileName,
  label,
}) => {
  const file = new Blob([text], { type: "text/plain" });

  return (
    <a href={URL.createObjectURL(file)} download={fileName}>
      {label ? label : "Download as file"}
    </a>
  );
};

export default DownloadTextAsFileLink;
