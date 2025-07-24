import axios from "./axiosConfig";

const API_URL = "/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  zone: string;
}

export interface AuthResponse {
  access_token: string;
  vendor_id: string;
  name: string;
  zone: string;
  message?: string;
}

interface RegisterResponse {
  success: boolean;
  data?: AuthResponse;
  error?: string;
}

// Add Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  // Add other fields as needed
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

class AuthService {
  // Fetch vendor products (requires authentication)
  async getVendorProducts(): Promise<Product[]> {
    const token = this.getToken();
    const vendor = this.getVendor();
    if (!vendor) throw new Error("No vendor in localStorage");
    try {
      const response = await axios.get(
        `${API_URL}/vendor/${vendor.id}/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching vendor products:", error);
      throw error;
    }
  }

  // Login method
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("authService.login called", credentials);
    try {
      const response = await axios.post(
        `${API_URL}/vendor/login`,
        credentials,
        { headers: { "Content-Type": "application/json" } }
      );
      const responseData = response.data;
      console.log("Login response:", responseData);

      // Handle the wrapped response format from backend
      if (responseData.success && responseData.data) {
        const data = responseData.data;
        if (data.access_token && data.vendor_id) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("vendor_id", data.vendor_id);
          localStorage.setItem(
            "vendor",
            JSON.stringify({
              id: data.vendor_id,
              name: data.name,
              zone: data.zone || "default",
            })
          );
          return {
            access_token: data.access_token,
            vendor_id: data.vendor_id,
            name: data.name,
            zone: data.zone || "default",
          };
        } else {
          throw new Error("Invalid response format from server");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as ApiError).response === 'object' &&
        (error as ApiError).response !== null
      ) {
        console.error("authService.login error", (error as ApiError).response?.data || (error as ApiError).message);
        throw new Error(
          (error as ApiError).response?.data?.error || "Login failed. Please try again."
        );
      } else {
        console.error("authService.login error", error);
        throw new Error("Login failed. Please try again.");
      }
    }
  }

  // Register method
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post<RegisterResponse>(
        `${API_URL}/vendor/register`,
        data
      );
      const responseData = response.data;
      if (hasRegisterData(responseData)) {
        const vendorData = responseData.data;
        localStorage.setItem("token", vendorData.access_token);
        localStorage.setItem("vendor_id", vendorData.vendor_id);
        localStorage.setItem(
          "vendor",
          JSON.stringify({
            id: vendorData.vendor_id,
            name: vendorData.name,
            zone: vendorData.zone,
          })
        );
        return vendorData;
      } else if (!responseData.data) {
        throw new Error("No data returned from server");
      } else {
        throw new Error(
          responseData.error || "Invalid response format from server"
        );
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as ApiError).response === 'object' &&
        (error as ApiError).response !== null
      ) {
        console.error(
          "Registration error:",
          (error as ApiError).response?.data || (error as ApiError).message
        );
        throw new Error(
          (error as ApiError).response?.data?.error || "Registration failed. Please try again."
        );
      } else {
        console.error("Registration error:", error);
        throw new Error("Registration failed. Please try again.");
      }
    }
  }

  // Logout method
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("vendor_id");
    localStorage.removeItem("vendor");
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  // Get vendor info from localStorage
  getVendor(): { id: string; name: string; zone: string } | null {
    const vendor = localStorage.getItem("vendor");
    return vendor ? JSON.parse(vendor) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Type guards
function isAuthResponse(data: unknown): data is AuthResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).access_token === "string" &&
    typeof (data as Record<string, unknown>).vendor_id === "string" &&
    typeof (data as Record<string, unknown>).name === "string" &&
    typeof (data as Record<string, unknown>).zone === "string"
  );
}

function hasRegisterData(response: RegisterResponse): response is RegisterResponse & { data: AuthResponse } {
  return (
    response.success === true &&
    !!response.data &&
    isAuthResponse(response.data)
  );
}

const authService = new AuthService();
export default authService;