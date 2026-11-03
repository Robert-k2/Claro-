// Section: a heading for a group of content, e.g. "Documents" with a hint like "2 to do" on the right.
export const Section = ({ title, hint }) => (
  // Row layout: title on the left, hint on the right. 'baseline' lines up the text bottoms
  // even though the two texts have different font sizes.
  <View style={{ marginTop: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <Text style={{ color: C.ink, fontSize: 18, fontWeight: '800' }}>{title}</Text>
    {/* !!hint turns the value into true/false, so the hint only renders when one was passed */}
    {!!hint && <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600' }}>{hint}</Text>}
  </View>
);



// Btn: the app's one button component.
// Props: title (label), onPress (tap handler), icon (optional Ionicons name),
//        kind (which colour style), small (compact size), full (stretch to full width), style (extra overrides).
export function Btn({ title, onPress, icon, kind = 'primary', small, full, style }) {
  // Colour sets for each button style: bg = background, fg = text/icon colour, bd = border colour.
  // [kind] at the end picks the set that matches the 'kind' prop (default 'primary').
  const k = {
    primary: { bg: C.brand, fg: C.white, bd: C.brand },        // solid teal: main action
    soft: { bg: C.brandSoft, fg: C.brand, bd: C.brandSoft },   // pale teal: secondary action
    ghost: { bg: C.white, fg: C.ink, bd: C.line },             // white with a border: low-emphasis action
    danger: { bg: '#dceb0d', fg: C.bad, bd: '#FDE6E4' },       // light red: destructive action (cancel, send back)
  }[kind];
  return (
    // Pressable detects taps. Its style can be a function that receives { pressed },
    // which lets the button react while the finger is down.
    <Pressable onPress={onPress} style={({ pressed }) => [{
      // Lay out icon and text side by side, centred, with a 6px gap between them.
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: k.bg, borderColor: k.bd, borderWidth: 1,
      borderRadius: 12,
      // Small buttons get less padding.
      paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 12 : 16,
      // Fade to 75% while pressed, as tap feedback.
      opacity: pressed ? 0.75 : 1,
      // 'stretch' fills the parent's width; 'flex-start' shrinks the button to fit its content.
      alignSelf: full ? 'stretch' : 'flex-start',
    }, style]}>  {/* the caller's style comes last, so it can override any default above */}
      {/* Show the icon only if one was given; its size and colour follow the button size and style. */}
      {!!icon && <Ionicons name={icon} size={small ? 15 : 18} color={k.fg} />}
      <Text style={{ color: k.fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

// Palette that avatar colours are picked from.
const HUES = ['#0F766E', '#2453B8', '#7C3AED', '#B45309', '#BE185D', '#0E7490'];

// Avatar: a circle with the person's initials. The colour is derived from the name,
// so the same person always gets the same colour.
export function Avatar({ name, size = 40 }) {
  // [...name] splits the name into characters; reduce adds up their character codes;
  // % HUES.length wraps that total into a valid index (0-5).
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    // borderRadius = half the size makes a perfect circle.
    // hue + '1F' appends a hex alpha value, giving the same colour at about 12% opacity as the background.
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hue + '1F', alignItems: 'center', justifyContent: 'center' }}>
      {/* initials() comes from data.js, e.g. "Camila Reyes" -> "CR". Font scales with the avatar size. */}
      <Text style={{ color: hue, fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
};

// IconBadge: a rounded square with an icon inside (used on document rows).
// Defaults to a teal icon on a pale teal background; callers pass status colours to override them.
export const IconBadge = ({ name, color = C.brand, bg = C.brandSoft, size = 40 }) => (
  <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    {/* The icon is half the badge size so it has comfortable padding. */}
    <Ionicons name={name} size={size * 0.5} color={color} />
  </View>
);

// Progress: a horizontal progress bar. 'value' is a number from 0 to 1 (e.g. 0.4 = 40%).
export const Progress = ({ value }) => (
  // Outer grey track; overflow:'hidden' keeps the inner bar inside the rounded corners.
  <View style={{ height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' }}>
    {/* Inner teal bar; its width is the value turned into a rounded percentage string, e.g. "40%". */}
    <View style={{ width: `${Math.round(value * 100)}%`, height: 8, backgroundColor: C.brand, borderRadius: 4 }} />
  </View>
);

// Field: a styled text input. It accepts every normal TextInput prop
// (value, onChangeText, placeholder, multiline...) because {...props} passes them straight through.
export function Field(props) {
  return (
    <TextInput placeholderTextColor={C.mut} {...props}
      // Default look (light fill, thin border, rounded corners); props.style is added last so callers can override it.
      style={[{ borderWidth: 1, borderColor: C.line, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: C.ink, fontSize: 15 }, props.style]} />
  );
}

// Empty: the friendly placeholder shown when a list has nothing in it yet
// (e.g. "No bookings yet"). A large grey icon with a centred message below it.
export const Empty = ({ icon, text }) => (
  <View style={{ alignItems: 'center', padding: 28 }}>
    <Ionicons name={icon} size={34} color={C.mut} />
    <Text style={{ color: C.sub, marginTop: 8, textAlign: 'center' }}>{text}</Text>
  </View>
);

// Chip: a small one-line label with an icon, used for due dates and attached file names.
// 'color' lets the caller tint it, e.g. red for an overdue date.
export const Chip = ({ icon, text, color = C.sub }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
    <Ionicons name={icon} size={13} color={color} />
    {/* flexShrink:1 lets a long file name wrap or shrink instead of pushing off the screen. */}
    <Text style={{ color, fontSize: 12.5, fontWeight: '600', flexShrink: 1 }}>{text}</Text>
  </View>
);