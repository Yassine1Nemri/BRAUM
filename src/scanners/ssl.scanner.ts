import { sslChecker } from "ssl-checker";
import type { SSLFinding, SSLScanResult } from "../types/ssl-scan.js";

interface CertificateIdentity {
  CN: string;
  O?: string;
  C?: string;
}

const EXPIRY_WARNING_DAYS = 30;
const TLS_CRITICAL_VERSIONS = new Set(["TLSv1", "TLSv1.0", "TLSv1.1"]);
const SSL_SCAN_TIMEOUT_MS = 5000;

export async function scanSSL(hostname: string): Promise<SSLScanResult> {
  try {
    const certificate = await withTimeout(
      sslChecker(hostname, {
        timeout: SSL_SCAN_TIMEOUT_MS,
        warnDays: EXPIRY_WARNING_DAYS,
      }),
      SSL_SCAN_TIMEOUT_MS,
    );

    const findings: SSLFinding[] = [];
    const expiresAt = certificate.validTo;
    const daysLeft = certificate.daysRemaining;
    const tlsVersion = certificate.protocol;
    const selfSigned = isSelfSignedCertificate(
      certificate.subject,
      certificate.issuer,
      certificate.validationError,
    );

  if (certificate.valid) {
    findings.push({
      check: "certificate-validity",
      severity: "info",
      message: "Certificate is valid.",
      recommendation: null,
    });
  } else {
    findings.push({
      check: "certificate-validity",
      severity: "critical",
      message: certificate.validationError
        ? `Certificate validation failed: ${certificate.validationError}.`
        : "Certificate validation failed.",
      recommendation:
        "Install a valid certificate from a trusted certificate authority.",
    });
  }

  if (daysLeft < 0) {
    findings.push({
      check: "certificate-expiry",
      severity: "critical",
      message: `Certificate expired ${Math.abs(daysLeft)} day(s) ago.`,
      recommendation: "Renew and deploy the TLS certificate immediately.",
    });
  } else if (daysLeft < EXPIRY_WARNING_DAYS) {
    findings.push({
      check: "certificate-expiry",
      severity: "warning",
      message: `Certificate expires in ${daysLeft} day(s).`,
      recommendation:
        "Renew the TLS certificate before it expires to avoid service disruption.",
    });
  } else {
    findings.push({
      check: "certificate-expiry",
      severity: "info",
      message: `Certificate expires in ${daysLeft} day(s).`,
      recommendation: null,
    });
  }

  if (TLS_CRITICAL_VERSIONS.has(tlsVersion)) {
    findings.push({
      check: "tls-version",
      severity: "critical",
      message: `Server negotiated deprecated TLS version ${tlsVersion}.`,
      recommendation: "Disable TLS 1.0 and TLS 1.1; require TLS 1.2 or newer.",
    });
  } else {
    findings.push({
      check: "tls-version",
      severity: "info",
      message: `Server negotiated ${tlsVersion}.`,
      recommendation: null,
    });
  }

  if (selfSigned) {
    findings.push({
      check: "self-signed-certificate",
      severity: "critical",
      message: "Certificate appears to be self-signed.",
      recommendation:
        "Replace the self-signed certificate with one issued by a trusted certificate authority.",
    });
  } else {
    findings.push({
      check: "self-signed-certificate",
      severity: "info",
      message: "Certificate does not appear to be self-signed.",
      recommendation: null,
    });
  }

    return {
      valid: certificate.valid,
      expiresAt,
      daysLeft,
      tlsVersion,
      score: calculateScore({
        valid: certificate.valid,
        expired: daysLeft < 0,
        expiringSoon: daysLeft >= 0 && daysLeft < EXPIRY_WARNING_DAYS,
        deprecatedTls: TLS_CRITICAL_VERSIONS.has(tlsVersion),
        selfSigned,
      }),
      findings,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      return {
        status: "timeout",
        valid: false,
        expiresAt: "",
        daysLeft: 0,
        tlsVersion: "",
        score: 0,
        findings: [{ message: "timeout" }],
      };
    }

    throw error;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timeout")), timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timeout));
  });
}

function isSelfSignedCertificate(
  subject: CertificateIdentity,
  issuer: CertificateIdentity,
  validationError: string | null,
): boolean {
  if (validationError?.toLowerCase().includes("self signed")) {
    return true;
  }

  return (
    subject.CN === issuer.CN &&
    subject.O === issuer.O &&
    subject.C === issuer.C
  );
}

function calculateScore({
  valid,
  expired,
  expiringSoon,
  deprecatedTls,
  selfSigned,
}: {
  valid: boolean;
  expired: boolean;
  expiringSoon: boolean;
  deprecatedTls: boolean;
  selfSigned: boolean;
}): number {
  let score = 100;

  if (!valid) {
    score -= 30;
  }

  if (expired) {
    score -= 30;
  } else if (expiringSoon) {
    score -= 15;
  }

  if (deprecatedTls) {
    score -= 25;
  }

  if (selfSigned) {
    score -= 20;
  }

  return Math.max(0, score);
}
