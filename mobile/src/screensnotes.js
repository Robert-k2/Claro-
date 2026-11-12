export function CaseScreen({ S, who, a }) {
  // Gets the selected applicant's visa case from the application state.

  const c = S.cases[who];

  // Filters the documents and counts how many have been approved.
  const approved = c.docs.filter((d) => d.status === 'Approved').length;

  // Finds documents that are missing or need correction,
  // then sorts them by due date and selects the earliest one.
  const next = c.docs.filter(isOpen).sort((x, y) => (x.due || '9').localeCompare(y.due || '9'))[0];

  // Finds the position of that document in the original array.
  // Returns -1 if no document requires attention.
  const nextAt = next ? c.docs.indexOf(next) : -1;

  // Returns the screen's user interface.
  return (
    <View>
      <Card>
        <Row>
          <Row style={{ flex: 1, justifyContent: 'flex-start' }}>
            {/* Displays the applicant's avatar. */}
            <Avatar name={c.name} size={46} />

            <View style={{ flex: 1 }}>
              {/* Displays the applicant's university. */}
              <Txt style={{ fontSize: 17 }}>{c.uni}</Txt>

              {/* Displays the applicant's country and visa type. */}
              <Muted>{c.from} → Czech Republic · Study visa</Muted>
            </View>        </Row>
        </Row>

        {/* Displays the application's progress through the visa stages. */}
        <Stepper status={c.status} />

        <View style={{ marginTop: 18 }}>
          {/* Displays the number of approved documents against the total. */}
          <Row style={{ marginBottom: 6 }}>
            <Muted>Documents approved</Muted>
            <Txt style={{ fontSize: 13 }}>{approved} / {c.docs.length}</Txt>
          </Row>

          {/* Displays the document approval progress bar. */}
          <Progress value={approved / c.docs.length} />
        </View>
      </Card>

      {/* Displays the applicant's next required action. */}
      <View style={{ backgroundColor: C.brandDark, borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 12 }}>

        {/* Shows an arrow if action is required, otherwise a tick. */}
        <Ionicons name={next ? 'arrow-forward-circle' : 'checkmark-circle'} size={30} color="#5EEAD4" />

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#99F6E4', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
            YOUR NEXT STEP
          </Text>

          {/* Tells the applicant what they need to do next. */}
          <Text style={{ color: C.white, fontSize: 16, fontWeight: '700', marginTop: 3 }}>
            {next ? `${next.status === 'Missing' ? 'Upload' : 'Fix and re-upload'} ${next.name.toLowerCase()}` : 'All documents are in. Nothing to do.'}
          </Text>

          {/* Displays the document's due-date information. */}
          {next && <Text style={{ color: '#CCFBF1', marginTop: 3 }}>{dueInfo(next.due).text}</Text>}

          {/* Displays an upload button if a document requires attention. */}
          {next && (
            <View style={{ marginTop: 10 }}>
              <Btn small kind="soft" icon="cloud-upload" title="Upload now" onPress={() => a.upload(who, nextAt)} />
            </View>
          )}
        </View>
      </View>

      {/* Displays the Documents heading and number requiring attention. */}
      <Section title="Documents" hint={`${c.docs.filter(isOpen).length} to do`} />

      {/* Loops through all the applicant's documents. */}
      {c.docs.map((d, i) => {

        // Gets the appropriate colour and icon for the document status.
        const t = toneOf(d.status);

        // Gets due-date information if a due date exists and the document
        // has not already been approved.
        const due = d.due && d.status !== 'Approved' ? dueInfo(d.due) : null;

        return (
          <Card key={d.name} style={{ padding: 14 }}>
            <Row style={{ alignItems: 'flex-start' }}>

              {/* Displays an icon representing the document's status. */}
              <IconBadge name={t.icon} color={t.fg} bg={t.bg} />

              <View style={{ flex: 1 }}>
                {/* Displays the document name. */}
                <Txt>{d.name}</Txt>

                {/* Displays the due date when applicable. */}
                {due && <Chip icon="calendar-outline" text={due.text} color={LEVEL[due.level]} />}

                {/* Displays the uploaded filename if one exists. */}
                {!!d.file && <Chip icon="attach" text={d.file} />}
              </View>

              {/* Displays the document's current status. */}
              <Pill label={d.status} />
            </Row>

            {/* Displays a correction note if one exists. */}
            {!!d.note && (
              <View style={{ backgroundColor: '#FEF0D3', borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', gap: 8 }}>
                <Ionicons name="chatbubble-ellipses" size={16} color={C.warn} />
                <Text style={{ flex: 1, color: '#7A4505', fontSize: 13 }}>{d.note}</Text>
              </View>
            )}

            {/* Displays an upload button for missing or incorrect documents. */}
            {isOpen(d) && (
              <View style={{ marginTop: 12 }}>
                <Btn
                  small
                  kind={d.status === 'Missing' ? 'primary' : 'soft'}
                  icon="cloud-upload"
                  title={d.status === 'Missing' ? 'Upload file' : 'Upload corrected file'}
                  onPress={() => a.upload(who, i)}
                />
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}