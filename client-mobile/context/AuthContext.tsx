import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest, ApiError } from "../utils/api";
import { getToken, removeToken, saveToken } from "../utils/tokenStorage";

// Thông tin người dùng server trả về (khớp hàm toPublicUser ở server/src/controllers/authController.js)
export type UserRole = "customer" | "technician" | "admin";
export type AuthUser = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string; // dạng 10 số, ví dụ 0901234567
  role: UserRole;
  mustChangePassword?: boolean;
};

export type SignUpData = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

type AuthResult = { token: string; user: AuthUser };

type AuthContextValue = {
  isLoaded: boolean; // đã đọc xong token đã lưu chưa (giống isLoaded của Clerk trước đây)
  isSignedIn: boolean;
  user: AuthUser | null;
  signIn: (account: string, password: string) => Promise<AuthUser>;
  signUp: (data: SignUpData) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string }) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Bọc toàn app (trong src/app/_layout.tsx) để màn hình nào cũng lấy được người dùng hiện tại
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mở app: nếu còn token đã lưu thì hỏi server xem token còn hiệu lực không
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getToken();
        if (token) {
          const me = await apiRequest<AuthUser>("/auth/me");
          setUser(me);
        }
      } catch (error) {
        // 401 = token hết hạn/không hợp lệ → xóa đi, người dùng đăng nhập lại
        // Lỗi mạng thì giữ token để lần mở app sau thử lại
        if (error instanceof ApiError && error.status === 401) {
          await removeToken();
        }
      } finally {
        setIsLoaded(true);
      }
    };
    restoreSession();
  }, []);

  // Lưu token + người dùng sau khi đăng nhập/đăng ký thành công
  const handleAuthResult = async ({ token, user: loggedInUser }: AuthResult) => {
    await saveToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  // account: email hoặc số điện thoại
  const signIn = async (account: string, password: string) => {
    const result = await apiRequest<AuthResult>("/auth/login", {
      method: "POST",
      body: { account, password },
    });
    // Tài khoản quản trị chỉ dùng trên Admin Web
    if (result.user.role === "admin") {
      throw new ApiError("Tài khoản quản trị chỉ đăng nhập trên Admin Web.", 403);
    }
    return handleAuthResult(result);
  };

  // Khách hàng tự đăng ký; server luôn gán role = "customer"
  const signUp = async (data: SignUpData) => {
    const result = await apiRequest<AuthResult>("/auth/register", { method: "POST", body: data });
    return handleAuthResult(result);
  };

  // JWT không cần báo server khi đăng xuất: chỉ cần xóa token trên máy
  const signOut = async () => {
    await removeToken();
    setUser(null);
  };

  // Sửa họ tên / số điện thoại của chính mình
  const updateProfile = async (data: { fullName?: string; phone?: string }) => {
    const updated = await apiRequest<AuthUser>("/auth/me", { method: "PUT", body: data });
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{ isLoaded, isSignedIn: !!user, user, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Dùng trong màn hình: const { isLoaded, isSignedIn, user, signOut } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return context;
};
