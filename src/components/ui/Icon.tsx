import type { SVGProps } from "react";

// A small set of hairline icons, drawn to match the type.

const PATHS = {
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  share: "M12 15V3.5M8 7l4-3.5L16 7M5 12v7.5h14V12",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  close: "M6 6l12 12M18 6 6 18",
  "arrow-right": "M4 12h16m-6-6 6 6-6 6",
  "arrow-left": "M20 12H4m6-6-6 6 6 6",
  "arrow-down": "M12 4v16m-6-6 6 6 6-6",
  "arrow-up": "M12 20V4m-6 6 6-6 6 6",
  "arrow-up-right": "M7 17 17 7M8 7h9v9",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  pause: "M8 5v14M16 5v14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.5 4.5",
  download: "M12 4v12m-5-5 5 5 5-5M5 20h14",
  print: "M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7v-6Z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  check: "M5 12.5 10 17.5 19 7",
  menu: "M4 8h16M4 16h16",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.500 15 12 21 12 21Zm0-8.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5Z",
  video: "M4 6.500h11v11H4v-11ZM15 10.500l5-3v9l-5-3",
  plus: "M12 5v14M5 12h14",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  mail: "M4 6h16v12H4V6Zm0 1 8 6 8-6",
  image: "M4 5h16v14H4V5Zm0 11 5-5 4 4 3-3 4 4M15.500 9.500h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4",
  eye: "M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12Zm9.500 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4m-4-4h10",
} as const;

const BRANDS = {
  whatsapp:
    "M12 3a9 9 0 0 0-7.700 13.600L3 21l4.500-1.200A9 9 0 1 0 12 3Zm-3.100 4.700c.2 0 .4 0 .600.400l.800 1.900c.1.200 0 .400-.100.600l-.600.700c-.100.200-.200.300 0 .600.700 1.200 1.700 2.100 3 2.700.300.100.400.100.600-.100l.700-.900c.200-.200.400-.200.600-.100l1.800.900c.300.100.400.200.400.400 0 .800-.500 1.700-1.400 2-1.900.600-5.400-.800-7.400-4.200-1.100-1.900-.700-3.700.300-4.600.200-.200.500-.300.700-.300Z",
  facebook: "M13.500 21v-7.500h2.600l.400-3h-3V8.600c0-.900.300-1.500 1.500-1.500h1.600V4.400c-.300 0-1.200-.100-2.300-.100-2.300 0-3.800 1.400-3.800 3.900v2.300H8v3h2.500V21h3Z",
  x: "M17.300 4h2.800l-6.100 7 7.200 9h-5.600l-4.400-5.500L6.200 20H3.400l6.500-7.500L3 4h5.700l4 5.100L17.300 4Zm-1 14.300h1.500L7.900 5.600H6.200l10.100 12.700Z",
} as const;

export type IconName = keyof typeof PATHS | keyof typeof BRANDS;

export function Icon({ name, size = 18, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const brand = name in BRANDS;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={brand ? "currentColor" : "none"}
      stroke={brand ? "none" : "currentColor"}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={brand ? BRANDS[name as keyof typeof BRANDS] : PATHS[name as keyof typeof PATHS]} />
    </svg>
  );
}
