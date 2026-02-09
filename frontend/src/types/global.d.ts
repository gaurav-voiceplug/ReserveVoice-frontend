type UserDetails = {
    _id: string;
    _v: number;
    location: string;
    name: string;
    role: string;
    timezone: string;
    brand_name: string;
    token: string;
};

type AuthContextType = {
    isAuthenticated: boolean;
    user: UserDetails | null;
    login: (data: UserDetails) => void;
    logout: () => void;
};