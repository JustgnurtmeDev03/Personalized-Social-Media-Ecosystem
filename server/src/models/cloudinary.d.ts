export interface CloudinaryUploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}
