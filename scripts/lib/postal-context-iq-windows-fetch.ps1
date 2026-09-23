param([Parameter(Mandatory=$true)][string]$Url)
$ErrorActionPreference = 'Stop'
# IQ-only read-only fallback using Windows' normal certificate validation.
# No credentials, cookies, automatic redirects, HTTP downgrade or TLS bypass.
$iqAllowed = @(
  'https://nogp.gov.iq/',
  'https://nogp.gov.iq/POLICIES.aspx',
  'https://nogp.gov.iq/ApiDocs.aspx',
  'https://nogp.gov.iq/api/v1/',
  'https://nogp.gov.iq/api/v1/search?q=postal&page_size=5&lang=both',
  'https://nogp.gov.iq/api/v1/search?q=postcode&page_size=5&lang=both',
  'https://nogp.gov.iq/api/v1/search?q=%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D8%AF&page_size=5&lang=both'
)
if ($Url -cnotin $iqAllowed) { throw 'iq-windows-url-not-approved' }
Add-Type -AssemblyName System.Net.Http
$iqHandler = [System.Net.Http.HttpClientHandler]::new()
$iqHandler.AllowAutoRedirect = $false
$iqHandler.UseCookies = $false
$iqHandler.UseDefaultCredentials = $false
$iqClient = [System.Net.Http.HttpClient]::new($iqHandler)
$iqClient.Timeout = [TimeSpan]::FromSeconds(25)
$iqCancellation = [System.Threading.CancellationTokenSource]::new(25000)
$iqResponse = $null
$iqMemory = [System.IO.MemoryStream]::new()
try {
  $iqResponse = $iqClient.GetAsync($Url, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead, $iqCancellation.Token).GetAwaiter().GetResult()
  $iqHeaders = @{}
  foreach ($iqHeader in $iqResponse.Headers) { $iqHeaders[$iqHeader.Key] = $iqHeader.Value -join ', ' }
  foreach ($iqHeader in $iqResponse.Content.Headers) { $iqHeaders[$iqHeader.Key] = $iqHeader.Value -join ', ' }
  if ([int]$iqResponse.StatusCode -eq 200) {
    if ($iqResponse.Content.Headers.ContentLength -gt 2097152) { throw 'iq-windows-byte-limit' }
    $iqStream = $iqResponse.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
    try {
      $iqBuffer = [byte[]]::new(16384)
      while (($iqRead = $iqStream.ReadAsync($iqBuffer,0,$iqBuffer.Length,$iqCancellation.Token).GetAwaiter().GetResult()) -gt 0) {
        if ($iqMemory.Length + $iqRead -gt 2097152) { throw 'iq-windows-byte-limit' }
        $iqMemory.Write($iqBuffer,0,$iqRead)
      }
    } finally { $iqStream.Dispose() }
  }
  @{status=[int]$iqResponse.StatusCode; headers=$iqHeaders; bodyBase64=[Convert]::ToBase64String($iqMemory.ToArray())} | ConvertTo-Json -Depth 3 -Compress
} finally {
  if ($null -ne $iqResponse) { $iqResponse.Dispose() }
  $iqMemory.Dispose()
  $iqCancellation.Dispose()
  $iqClient.Dispose()
  $iqHandler.Dispose()
}
