import * as Yup from "yup";

export const emailSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const codeSchema = Yup.object().shape({
  code: Yup.string().required("Code is required"),
});

export const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .min("Password must be at least 8 characters long")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Password & Confirm Password do not match.")
    .required("Confirm password is required"),
});

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .required("Password is required"),
});

export const fileSchema = Yup.mixed()
  .test("fileSize", "Kích thước file quá lớn (tối đa 30MB)", (value) => {
    if (!value || value.length === 0) return true; // Không bắt buộc đính kèm
    return value[0].size <= 31457280; // 30MB
  })
  .test("fileType", "Chỉ chấp nhận hình ảnh hoặc video", (value) => {
    if (!value || value.length === 0) return true;
    return (
      value[0].type.startsWith("image/") || value[0].type.startsWith("video/")
    );
  });
