export function downloadFile(tsvString: string, fileName: string) {
  const a = document.createElement("a");
  a.download = fileName;
  const blob = new Blob([tsvString], { type: "text/plain" });
  a.href = URL.createObjectURL(blob);
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export const downloadFileFromUrl = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  URL.revokeObjectURL(objectUrl);
  document.body.removeChild(link);
};
