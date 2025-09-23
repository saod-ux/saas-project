import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    hasAzureClientId: !!process.env.AZURE_AD_CLIENT_ID,
    hasAzureClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
    hasAzureTenantId: !!process.env.AZURE_AD_TENANT_ID,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    azureClientId: process.env.AZURE_AD_CLIENT_ID?.substring(0, 8) + "...",
    azureTenantId: process.env.AZURE_AD_TENANT_ID?.substring(0, 8) + "...",
    nextAuthUrl: process.env.NEXTAUTH_URL,
  };

  const allConfigured = config.hasAzureClientId && 
                       config.hasAzureClientSecret && 
                       config.hasAzureTenantId && 
                       config.hasNextAuthSecret && 
                       config.hasNextAuthUrl;

  return NextResponse.json({
    configured: allConfigured,
    config,
    message: allConfigured 
      ? "Azure AD configuration looks good!" 
      : "Some Azure AD environment variables are missing or using placeholder values.",
    nextSteps: allConfigured 
      ? [
          "Visit /test-auth to test the authentication flow",
          "Click 'Sign in with Azure AD' to start the OAuth flow",
          "You'll be redirected to Microsoft's login page"
        ]
      : [
          "Update your .env file with real Azure AD values",
          "Get these from the Azure Portal > App registrations",
          "Replace placeholder values like 'your-azure-ad-client-id'"
        ]
  });
}

