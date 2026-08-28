export interface JwtPayload {
    sub: string;
    email: string;
    organizationId: string;
    churchId?: string;
    role: string;
}
