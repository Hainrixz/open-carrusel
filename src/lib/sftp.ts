import SftpClient from 'ssh2-sftp-client'
import path from 'path'

const config = () => ({
  host: process.env.FTP_HOST!,
  username: process.env.FTP_USER!,
  password: process.env.FTP_PASSWORD!,
})

const remotePath = (postId: string, filename: string) =>
  `/public_html/tmp/${postId}/${filename}`

const publicUrl = (postId: string, filename: string) =>
  `${process.env.PUBLIC_BASE_URL}/${postId}/${filename}`

export async function uploadFiles(postId: string, localPaths: string[]): Promise<string[]> {
  const sftp = new SftpClient()
  await sftp.connect(config())

  const urls: string[] = []
  for (const localPath of localPaths) {
    const filename = path.basename(localPath)
    await sftp.put(localPath, remotePath(postId, filename))
    urls.push(publicUrl(postId, filename))
  }

  await sftp.end()
  return urls
}

export async function deleteFiles(postId: string, filenames: string[]): Promise<void> {
  const sftp = new SftpClient()
  await sftp.connect(config())

  for (const filename of filenames) {
    await sftp.delete(remotePath(postId, filename))
  }

  await sftp.end()
}
