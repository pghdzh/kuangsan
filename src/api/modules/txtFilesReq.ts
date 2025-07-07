import http from "../axios";

/**
 * 上传单个 TXT 文件
 * @param file      - 单个 File 对象（.txt）
 * @param uploader  - 上传人昵称
 * @param roleName  - 所属角色（如 kurumi）
 */
export const uploadTxtFile = (
  file: File,
  uploader: string,
  roleName: string = "kurumi"
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploader", uploader);
  formData.append("role_name", roleName);

  return http.post("/api/book", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * 获取所有上传的 TXT 文件列表
 */
export const getAllTxtFiles = (page = 1, limit = 10) => {
  return http.get("/api/book", { page, limit });
};
