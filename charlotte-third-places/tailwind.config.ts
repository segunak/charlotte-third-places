import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme"

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			}
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-sans)", ...fontFamily.sans]
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				gold: "#FFD700",
				amberGold: "#FFCC00",
				saffronGold: "#FFC125",
				paleGold: "#E6BE8A ",
				antiqueGold: "#D4AF37",
				uncCharlotteGreen: "#005035",
				uncCharlotteGold: "#A49665",
				charlotteOrange: "#EA983E",
				charlotteDarkGreen: "#24824A",
				charlotteLightGreen: "#71BF44",
				charlottePaperWhite: "#FFFFFF",
				charlotteTextBlack: "#141E28",
				charlotteYellow: "#FADD4A",
				charlotteBlue: "#2F70B8",
				charlotteMediumBlue: "#02508E",
				charlotteLightRed: "#E0685E",
				charlotteRed: "#DE0505",
				charlotteDarkRed: "#C70000",
				charlottePurple: "#59489F",
				charlotteNavy: "#0C1C35",
				charlotteDarkTeal: "#0A7D8C",
				charlotteLightTeal: "#00A79C",
				charlotteLegacyGreen: "#007953",
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};

export default config;