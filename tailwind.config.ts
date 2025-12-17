import type { Config } from "tailwindcss";

const config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: [
					'var(--font-sans)',
					'Montserrat',
					'ui-sans-serif',
					'system-ui'
				]
			},
			screens: {
				sm: {
					max: '639px'
				},
				'sm+': {
					min: '640px'
				},
				'nest-hub': '1024px',
				'nest-hub-max': '1280px',
				'mid-screen': { min: '768px', max: '1280px' }
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				ocean: '#54B2F1',
				tangerine: '#F9C15F',
				white: '#FFFFFF',
				sky: '#C4F0FF',
				sunset: '#FF661A',
				pool: '#71D6F7',
				espresso: '#484139',
				espressoLight: '#6A5B4B',
				sea: '#7BC7F4',
				stone: '#CDC6BE',
				aquamarine: '#B2E7E8',
				mint: '#E3F7E9',
				golden: '#DAA520',
				greyish: '#868686',
				creamer: '#D2CCC3',
				creamerLight: '#DCD7D2',
				creamerDark: '#A59B92',
				coconut: '#FBF9E4',
				granite: '#A59B92',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-espresso': 'linear-gradient(232.07deg, #484139 21.25%, #CDC6BE 170.22%)',
				'gradient-creamer': 'linear-gradient(63.21deg, #DCD7D2 26.38%, rgba(165, 155, 146, 0.68) 77.88%)',
				'blue-block': 'radial-gradient(90.16% 143.01% at 15.32% 21.04%, rgba(165, 239, 255, 0.19) 0%, rgba(110, 191, 244, 0.1387) 77.08%, rgba(70, 144, 213, 0.1672) 100%)',
				'blue-block-soft': 'radial-gradient(circle at top left, rgba(165,239,255,0.12) 0%, rgba(110,191,244,0.10) 73%, rgba(70,144,212,0.12) 88%)',
				'gradient-popup':'linear-gradient(143.97deg, rgba(245, 243, 240, 0.2) 3.4%, rgba(220, 214, 207, 0.2) 84.7%)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				shine: {
					from: {
						backgroundPosition: '200% 0'
					},
					to: {
						backgroundPosition: '-200% 0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'caret-blink': {
					'0%,70%,100%': {
						opacity: '1'
					},
					'20%,50%': {
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in .5s ease-out',
				shine: 'shine 8s ease-in-out infinite',
				'caret-blink': 'caret-blink 1.25s ease-out infinite'
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '100ch',
						h1: {
							margin: '0',
							width: '100%',
							textAlign: 'left'
						},
						h2: {
							margin: '.5em',
							width: '100%',
							textAlign: 'left'
						},
						h3: {
							margin: '.5em',
							width: '100%',
							textAlign: 'left'
						},
						h4: {
							margin: '.5em',
							width: '100%',
							textAlign: 'left'
						}
					}
				}
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		// require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
	],
} satisfies Config;

export default config;
