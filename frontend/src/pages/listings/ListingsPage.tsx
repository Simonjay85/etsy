import { useState } from 'react'
import { Sparkles, Send, Copy, Download } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { THEMES } from '@/lib/constants'
import { aiApi } from '@/lib/api'
import { Card, CardHeader, Button, TagPill, ScoreRing, Badge, StatCard } from '@/components/ui'
import EtsyPublishModal from '@/components/ui/EtsyPublishModal'
import type { ListingGenResult } from '@/types'

const INDUSTRIES = ['General','Technology','Healthcare','Education',
                    'Finance','Design','Marketing','Legal','Engineering']

function calcScore(title:string, tags:string[], desc:string){
  return Math.min(100,Math.round(
    (title.length>=80?25:title.length/80*25)+
    (tags.length===13?25:tags.length/13*25)+
    (desc.length>=400?25:desc.length/400*25)+20
  ))
}

export default function ListingsPage() {
  const [themeId,  setThemeId]  = useState('midnight_navy')
  const [product,  setProduct]  = useState('cv')
  const [industry, setIndustry] = useState('General')
  const [loading,  setLoading]  = useState(false)

  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [tags,     setTags]     = useState<string[]>([])
  const [price,    setPrice]    = useState(4.99)
  const [newTag,   setNewTag]   = useState('')
  const [hasResult,setHasResult]= useState(false)
  const [showPub,  setShowPub]  = useState(false)

  const shopId = localStorage.getItem('cvs_etsy_shop') ?? ''
  const selTheme = THEMES.find(t=>t.id===themeId)!
  const score    = hasResult ? calcScore(title,tags,desc) : 0

  const generate = async () => {
    setLoading(true)
    try {
      const {data} = await aiApi.generateListing({
        template_name:   `${selTheme.name} Resume Template`,
        theme_color:     selTheme.name,
        product_type:    product,
        target_industry: industry,
      })
      setTitle(data.title); setDesc(data.description)
      setTags(data.tags);   setPrice(data.price_suggestion)
      setHasResult(true)
      toast.success('Listing generated!')
    } catch(e:any){toast.error(e.message)}
    finally{setLoading(false)}
  }

  const addTag = ()=>{
    const v=newTag.trim().toLowerCase()
    if(!v||tags.includes(v)||tags.length>=13||v.length>20)return
    setTags([...tags,v]);setNewTag('')
  }

  const copy=()=>{
    navigator.clipboard.writeText(`TITLE:\n${title}\n\nTAGS:\n${tags.join(', ')}\n\nDESCRIPTION:\n${desc}`)
    toast.success('Copied!')
  }

  const exportCsv=()=>{
    const csv=`title,tags,description,price\n"${title}","${tags.join(', ')}","${desc.replace(/"/g,'""')}","${price}"`
    const a=Object.assign(document.createElement('a'),{href:'data:text/csv,'+encodeURIComponent(csv),download:'listing.csv'})
    a.click()
  }

  return (
    <>
    <div className="grid grid-cols-2 gap-5 max-w-6xl">
      {/* Config */}
      <div className="space-y-4">
        <Card>
          <CardHeader title="Generate Etsy listing" />
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Theme</label>
              <div className="flex flex-wrap gap-1.5">
                {THEMES.slice(0,8).map(t=>(
                  <button key={t.id} onClick={()=>setThemeId(t.id)}
                    className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs transition-all',
                      themeId===t.id?'border-accent/40 bg-accent/10 text-accent':'border-white/[0.07] text-white/45 hover:bg-bg-4')}>
                    <span className="w-2 h-2 rounded-full" style={{background:t.color}}/>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Type</label>
                <select value={product} onChange={e=>setProduct(e.target.value)} className="input text-sm">
                  <option value="cv">CV / Resume</option>
                  <option value="cover_letter">Cover Letter</option>
                  <option value="planner">Digital Planner</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Industry</label>
                <select value={industry} onChange={e=>setIndustry(e.target.value)} className="input text-sm">
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <Button variant="primary" className="w-full py-2.5" loading={loading}
                    icon={<Sparkles size={14}/>} onClick={generate}>
              Generate with AI
            </Button>
          </div>
        </Card>

        {hasResult&&(
          <Card>
            <div className="flex items-center gap-4">
              <ScoreRing score={score} size={56}/>
              <div>
                <p className="text-sm font-medium">{score>=80?'Good SEO':score>=60?'Needs work':'Weak SEO'}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Title {title.length}/140 · {tags.length}/13 tags · {desc.length} chars
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Output */}
      {hasResult?(
        <div className="space-y-4">
          <Card>
            <CardHeader title="Title"
              action={<span className={clsx('text-xs',title.length>140?'text-red-400':title.length>=80?'text-green-400':'text-amber-400')}>{title.length}/140</span>}/>
            <textarea value={title} rows={3} onChange={e=>setTitle(e.target.value)} className="input resize-none text-sm leading-relaxed"/>
          </Card>

          <Card>
            <CardHeader title={`Tags (${tags.length}/13)`}
              action={<Badge variant={tags.length===13?'green':'amber'}>{tags.length}/13</Badge>}/>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t,i)=>(
                <TagPill key={t} label={t} onRemove={()=>setTags(tags.filter((_,j)=>j!==i))}/>
              ))}
            </div>
            {tags.length<13&&(
              <input value={newTag} onChange={e=>setNewTag(e.target.value)}
                     onKeyDown={e=>e.key==='Enter'&&addTag()}
                     placeholder="Add tag, press Enter…" className="input text-xs py-1.5"/>
            )}
          </Card>

          <Card>
            <CardHeader title="Description"
              action={<span className="text-xs text-white/30">{desc.length} chars</span>}/>
            <textarea value={desc} rows={8} onChange={e=>setDesc(e.target.value)}
                      className="input resize-none text-xs leading-relaxed"/>
          </Card>

          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 py-2.5" icon={<Copy size={13}/>} onClick={copy}>Copy</Button>
            <Button variant="ghost"   className="flex-1 py-2.5" icon={<Download size={13}/>} onClick={exportCsv}>CSV</Button>
            <Button variant="success" className="px-4 py-2.5"   icon={<Send size={13}/>} onClick={()=>setShowPub(true)}>Publish</Button>
          </div>
        </div>
      ):(
        <Card>
          <div className="py-20 text-center">
            <Sparkles className="mx-auto mb-3 text-white/20" size={28}/>
            <p className="text-sm text-white/50">Configure and generate your listing</p>
          </div>
        </Card>
      )}
    </div>

    {showPub&&(
      <EtsyPublishModal
        listing={{title,description:desc,tags,price_suggestion:price,seo_notes:''}}
        shopId={shopId}
        onClose={()=>setShowPub(false)}
        onPublished={id=>{setShowPub(false);toast.success(`Published! ID: ${id}`)}}
      />
    )}
    </>
  )
}
