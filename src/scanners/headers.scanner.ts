import axios from "axios";
import type { HeaderScanResult } from "../types/header-scan.js";

interface HeaderCheck {
  name: string;
  recommendation: string;
}

const HEADER_CHECKS: HeaderCheck[] = [
  {
    name: "Content-Security-Policy",
    recommendation:
      "Add a Content-Security-Policy header to reduce exposure to cross-site scripting and content injection attacks.",
  },
  {
    name: "Strict-Transport-Security",
    recommendation:
      "Add a Strict-Transport-Security header to require browsers to use HTTPS for future requests.",
  },
  {
    name: "X-Frame-Options",
    recommendation:
      "Add an X-Frame-Options header to reduce clickjacking risk.",
  },
  {
    name: "X-XSS-Protection",
    recommendation:
      "Add an X-XSS-Protection header for legacy browser XSS filtering support.",
  },
  {
    name: "Referrer-Policy",
    recommendation:
      "Add a Referrer-Policy header to control how much referrer information is shared.",
  },
  {
    name: "Permissions-Policy",
    recommendation:
      "Add a Permissions-Policy header to limit access to browser features and APIs.",
  },
];

const POINTS_PER_HEADER = 100 / HEADER_CHECKS.length;

export async function scanHeaders(url: string): Promise<HeaderScanResult> {
  const response = await axios.get(url, {
    maxRedirects: 5,
    timeout: 5000,
  });

  const findings = HEADER_CHECKS.map((headerCheck) => {
    const value = response.headers[headerCheck.name.toLowerCase()];

    if (value !== undefined) {
      return {
        header: headerCheck.name,
        present: true,
        value: Array.isArray(value) ? value.join(", ") : String(value),
        recommendation: null,
      };
    }

    return {
      header: headerCheck.name,
      present: false,
      value: null,
      recommendation: headerCheck.recommendation,
    };
  });

  const presentHeaderCount = findings.filter((finding) => finding.present).length;
  const score = Number((presentHeaderCount * POINTS_PER_HEADER).toFixed(1));

  return {
    score,
    findings,
  };
}
