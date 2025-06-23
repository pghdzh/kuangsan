import http from "../axios";

/**
 * @function 批量上传图片
 * @param {File[]} files      - 需要上传的图片列表
 * @param {string} nickname   - 游客昵称，必填
 * @returns {Promise<any>}
 */
export const uploadImages = (files: File[], nickname: string): Promise<any> => {
  if (!nickname) {
    return Promise.reject(new Error("nickname 为必填项"));
  }

  const formData = new FormData();
  formData.append("nickname", nickname);
  files.forEach((file) => {
    formData.append("images", file);
  });

  return http.post("/api/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getAllImages = (page: number = 1, limit: number = 10): any => {
  return http.get("/api/getAllImages", { page, limit });
};
