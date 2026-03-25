export async function submitNetlifyForm(
  formName: string,
  data: Record<string, string>,
): Promise<boolean> {
  try {
    const response = await fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': formName,
        ...data,
      }).toString(),
    });
    return response.ok;
  } catch {
    return false;
  }
}
