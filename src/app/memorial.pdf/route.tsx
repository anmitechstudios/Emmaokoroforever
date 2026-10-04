import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { db } from "@/lib/db";
import { FAMILY_GROUPS } from "@/lib/db/types";
import { fullDate, lifespan, longDate, paragraphs } from "@/lib/format";
import { getHome } from "@/lib/queries";
import { allow, visitorHash } from "@/lib/security/guard";
import { readImage } from "@/lib/storage";

// The memorial booklet: a document designed for paper, not a printout of the
// web page. Cover, story, timeline, family, service, tributes, closing.
//
// Note: line heights are set per text style. A lineHeight on the page style
// stops react-pdf from drawing the fixed footer.

const fonts = path.join(process.cwd(), "src/assets/fonts");
const face = (weight: number, style: "normal" | "italic") => ({
  src: path.join(fonts, `cormorant-garamond-latin-${weight}-${style}.woff`),
  fontWeight: weight,
  fontStyle: style,
});
Font.register({
  family: "Cormorant",
  fonts: [face(300, "normal"), face(300, "italic"), face(400, "normal"), face(400, "italic"), face(500, "normal"), face(500, "italic")],
});
Font.registerHyphenationCallback((word) => [word]);

// "The Years" is commented out on the website for now; keep the booklet in step.
const SHOW_TIMELINE = false;

const INK = "#24211d";
const SOFT = "#4a453e";
const MUTED = "#6e675d";
const LINE = "#ded6c8";

const s = StyleSheet.create({
  page: { paddingTop: 68, paddingBottom: 76, paddingHorizontal: 68, backgroundColor: "#fbf9f5", color: INK, fontFamily: "Cormorant", fontSize: 12.5 },
  cover: { padding: 68, backgroundColor: "#f6f2ea", color: INK, fontFamily: "Cormorant", alignItems: "center", justifyContent: "center" },
  eyebrow: { fontFamily: "Helvetica", fontSize: 7, letterSpacing: 2.6, textTransform: "uppercase", color: MUTED },
  h2: { fontSize: 34, fontWeight: 300, lineHeight: 1.05, marginTop: 10, marginBottom: 22 },
  h3: { fontSize: 20, fontWeight: 400, lineHeight: 1.15, marginTop: 5, marginBottom: 8 },
  body: { color: SOFT, marginBottom: 9, textAlign: "justify", lineHeight: 1.32 },
  rule: { height: 0.6, backgroundColor: LINE },
  footer: { position: "absolute", bottom: 38, left: 68, right: 68, flexDirection: "row", justifyContent: "space-between" },
});

async function jpeg(url: string, width: number, height?: number): Promise<Buffer | null> {
  const bytes = url ? await readImage(url) : null;
  if (!bytes) return null;
  // Crop from the top: in portraits of people, faces sit in the upper part of the frame.
  return sharp(bytes).resize(width, height, { fit: "cover", position: "north" }).jpeg({ quality: 82 }).toBuffer();
}

export async function GET() {
  if (!allow(`pdf:${await visitorHash()}`, 6, 10 * 60_000)) return new Response("Please try again in a few minutes.", { status: 429 });

  const { memorial, timeline, family, service } = await getHome();
  const accent = memorial.settings.accent;
  const on = memorial.settings.sections;
  const store = await db();
  const tributes = on.tributes
    ? await store.list("tributes", {
        where: { memorial_id: memorial.id, status: "approved" },
        order: [{ column: "likes", ascending: false }],
        limit: 12,
      })
    : [];

  const chapters = on.story ? memorial.chapters.filter((c) => c.title || c.body) : [];
  const [portrait, ...chapterImages] = await Promise.all([
    jpeg(memorial.hero_image_url, 720, 900),
    ...chapters.map((c) => jpeg(c.image_url, 1100, 800)),
  ]);

  const words = memorial.full_name.trim().split(/\s+/);
  const groups = FAMILY_GROUPS.map((g) => ({ ...g, members: family.filter((m) => m.family_group === g.key) })).filter((g) => g.members.length);

  const footer = (
    <View style={s.footer} fixed>
      <Text style={s.eyebrow}>{memorial.full_name}  ·  {lifespan(memorial.born_on, memorial.died_on)}</Text>
      <Text style={s.eyebrow} render={({ pageNumber }) => String(pageNumber).padStart(2, "0")} />
    </View>
  );

  const document = (
    <Document title={`${memorial.epitaph} — ${memorial.full_name}`} author={memorial.settings.contact_name || memorial.full_name} language="en">
      <Page size="A4" style={s.cover}>
        <Text style={s.eyebrow}>{memorial.epitaph}</Text>
        {portrait && (
          <Image
            src={{ data: portrait, format: "jpg" }}
            style={{ width: 216, height: 270, marginTop: 34, borderTopLeftRadius: 108, borderTopRightRadius: 108, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}
          />
        )}
        {memorial.honorific ? <Text style={{ fontSize: 16, fontStyle: "italic", color: MUTED, marginTop: 36 }}>{memorial.honorific}</Text> : null}
        <Text style={{ fontSize: 46, fontWeight: 300, lineHeight: 1, textAlign: "center", marginTop: memorial.honorific ? 6 : 36 }}>
          {words.slice(0, -1).join(" ")}
        </Text>
        <Text style={{ fontSize: 46, fontStyle: "italic", lineHeight: 1.05, color: accent, textAlign: "center" }}>{words[words.length - 1]}</Text>
        <Text style={[s.eyebrow, { marginTop: 24, fontSize: 8, color: SOFT }]}>
          {longDate(memorial.born_on)}  —  {longDate(memorial.died_on)}
        </Text>
        {memorial.quote ? (
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <View style={{ width: 0.6, height: 30, backgroundColor: accent }} />
            <Text style={{ fontSize: 15, fontStyle: "italic", textAlign: "center", color: SOFT, maxWidth: 330, marginTop: 18, lineHeight: 1.35 }}>
              “{memorial.quote}”
            </Text>
            {memorial.quote_source ? <Text style={[s.eyebrow, { marginTop: 10 }]}>{memorial.quote_source}</Text> : null}
          </View>
        ) : null}
      </Page>

      {chapters.length > 0 && (
        <Page size="A4" style={s.page}>
          {footer}
          <Text style={s.eyebrow}>The Story</Text>
          <Text style={s.h2}>The life of {memorial.short_name}</Text>
          {memorial.story_intro ? (
            <Text style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.35, color: SOFT, marginBottom: 26 }}>{memorial.story_intro}</Text>
          ) : null}
          {chapters.map((chapter, i) => (
            <View key={chapter.id} break={i > 0}>
              <View wrap={false}>
                {chapterImages[i] && <Image src={{ data: chapterImages[i]!, format: "jpg" }} style={{ width: "100%", height: 280, marginBottom: 16, borderRadius: 1 }} />}
                {chapter.kicker ? <Text style={s.eyebrow}>{chapter.kicker}</Text> : null}
                <Text style={s.h3}>{chapter.title}</Text>
              </View>
              {paragraphs(chapter.body).map((p, j) => (
                <Text key={j} style={s.body}>{p}</Text>
              ))}
              {chapter.pull_quote ? (
                <Text wrap={false} style={{ fontSize: 19, fontStyle: "italic", fontWeight: 300, textAlign: "center", color: accent, lineHeight: 1.25, marginVertical: 18, marginHorizontal: 30 }}>
                  “{chapter.pull_quote}”
                </Text>
              ) : null}
            </View>
          ))}
        </Page>
      )}

      {SHOW_TIMELINE && on.timeline && timeline.length > 0 && (
        <Page size="A4" style={s.page}>
          {footer}
          <Text style={s.eyebrow}>The Years</Text>
          <Text style={s.h2}>A life in years</Text>
          {timeline.map((event) => (
            <View key={event.id} wrap={false} style={{ flexDirection: "row", borderTopWidth: 0.6, borderTopColor: LINE, paddingVertical: 9.5 }}>
              <Text style={{ width: 92, fontSize: 26, fontWeight: 300, lineHeight: 1, color: accent }}>{event.year}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{event.title}</Text>
                {event.description ? <Text style={{ color: MUTED, fontSize: 11.5, marginTop: 2 }}>{event.description}</Text> : null}
              </View>
            </View>
          ))}
        </Page>
      )}

      {((on.family && groups.length > 0) || (on.service && service)) && (
        <Page size="A4" style={s.page}>
          {footer}
          {on.family && groups.length > 0 && (
            <View>
              <Text style={s.eyebrow}>Family</Text>
              <Text style={s.h2}>Lovingly survived by</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {groups.map((group) => (
                  <View key={group.key} wrap={false} style={{ width: "50%", paddingRight: 20, marginBottom: 20 }}>
                    <View style={[s.rule, { marginBottom: 9 }]} />
                    <Text style={s.eyebrow}>{group.label}</Text>
                    {group.members.map((member) => (
                      <View key={member.id} style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: 15, lineHeight: 1.2 }}>{member.name}</Text>
                        {member.note ? <Text style={{ fontSize: 11.5, fontStyle: "italic", color: MUTED }}>{member.note}</Text> : null}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {on.service && service && (service.date || service.venue) && (
            <View break={on.family && groups.length > 0}>
              <Text style={s.eyebrow}>The Service</Text>
              <Text style={[s.h2, { marginBottom: 8 }]}>{service.title || "Service"}</Text>
              <Text style={{ fontSize: 18, fontStyle: "italic", color: accent }}>
                {[service.date && fullDate(service.date), service.time].filter(Boolean).join(" · ")}
              </Text>
              <Text style={{ fontSize: 15, marginTop: 10 }}>{service.venue}</Text>
              <Text style={{ color: MUTED, fontSize: 11.5 }}>{service.address}</Text>
              {service.dress_code ? <Text style={{ color: SOFT, marginTop: 10 }}>Dress: {service.dress_code}</Text> : null}
              <View style={{ marginTop: 16 }}>
                {service.schedule.map((item) => (
                  <View key={item.id} style={{ flexDirection: "row", borderTopWidth: 0.6, borderTopColor: LINE, paddingVertical: 7 }}>
                    <Text style={{ width: 92, fontFamily: "Helvetica", fontSize: 8.5, color: MUTED, paddingTop: 3 }}>{item.time}</Text>
                    <Text style={{ flex: 1, fontSize: 13.5 }}>
                      {item.title}
                      {item.note ? <Text style={{ color: MUTED, fontSize: 11.5 }}>   {item.note}</Text> : null}
                    </Text>
                  </View>
                ))}
              </View>
              {service.notes ? <Text style={{ fontStyle: "italic", color: SOFT, marginTop: 12 }}>{service.notes}</Text> : null}
            </View>
          )}
        </Page>
      )}

      {tributes.length > 0 && (
        <Page size="A4" style={s.page}>
          {footer}
          <Text style={s.eyebrow}>Tributes</Text>
          <Text style={s.h2}>Words of love</Text>
          {tributes.map((tribute) => (
            <View key={tribute.id} wrap={false} style={{ borderTopWidth: 0.6, borderTopColor: LINE, paddingTop: 12, paddingBottom: 14 }}>
              <Text style={{ fontSize: 13.5, fontStyle: "italic", lineHeight: 1.42, color: SOFT }}>
                “{tribute.message.length > 620 ? `${tribute.message.slice(0, 600).replace(/\s+\S*$/, "")}…` : tribute.message}”
              </Text>
              <Text style={[s.eyebrow, { marginTop: 8 }]}>
                {tribute.name}
                {tribute.relationship ? `  ·  ${tribute.relationship}` : ""}
              </Text>
            </View>
          ))}
        </Page>
      )}

      <Page size="A4" style={s.cover}>
        <View style={{ width: 0.6, height: 44, backgroundColor: accent }} />
        {memorial.closing_message ? (
          <Text style={{ fontSize: 19, fontWeight: 300, textAlign: "center", lineHeight: 1.35, maxWidth: 360, marginTop: 28 }}>{memorial.closing_message}</Text>
        ) : null}
        {memorial.closing_message ? <Text style={[s.eyebrow, { marginTop: 22 }]}>— {memorial.settings.contact_name || "The family"}</Text> : null}
        <Text style={[s.eyebrow, { marginTop: 90 }]}>Forever Remembered</Text>
        <Text style={{ fontSize: 26, fontWeight: 300, marginTop: 10 }}>{memorial.full_name}</Text>
        <Text style={{ fontSize: 13, fontStyle: "italic", textAlign: "center", color: SOFT, marginTop: 16, lineHeight: 1.4 }}>
          “Those we love don't go away,{"\n"}they walk beside us every day.”
        </Text>
      </Page>
    </Document>
  );

  const pdf = await renderToBuffer(document);
  const filename = memorial.full_name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}-memorial.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
