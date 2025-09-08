// In frontend/src/components/icons/XIcon.tsx
export function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="24px"
      height="24px"
      {...props}
    >
      <path
        fill="#000000"
        d="M36.652,12.042H42l-11.656,13.311L44,40.958h-10.772l-8.377-10.948l-9.578,10.948H10l12.472-14.251L9,12.042h11.045l7.57,10.011L36.652,12.042z M33.284,37.168h2.989L18.688,15.628h-3.209L33.284,37.168z"
      />
    </svg>
  );
}
