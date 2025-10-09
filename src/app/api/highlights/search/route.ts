import { NextRequest, NextResponse } from 'next/server';
import { HighlightSearchMode } from '@/lib/types';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/openai';

/**
 * POST /api/highlights/search
 * 
 * Search highlights using keyword, semantic, or hybrid search
 * 
 * Request body:
 * {
 *   query: string;        // The search query
 *   mode: 'keyword' | 'semantic' | 'hybrid';  // Search mode
 *   limit?: number;       // Optional, max results to return (default: 10)
 * }
 * 
 * Response:
 * {
 *   results: HighlightSearchResult[];  // Array of highlights with optional scores
 *   count: number;                      // Number of results returned
 *   mode: string;                       // Search mode used
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from session (cookie-based auth)
    const supabaseAuth = createServerClient();
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Parse request body
    const body = await request.json();
    const { query, mode, limit = 10 } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (!mode || !['keyword', 'semantic', 'hybrid'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode is required and must be one of: keyword, semantic, hybrid' },
        { status: 400 }
      );
    }

    // Validate limit
    const parsedLimit = parseInt(String(limit), 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Perform search based on mode
    let searchResults: Array<any> = [];

    switch (mode) {
      case 'keyword': {
        const { data, error } = await supabase.rpc('search_highlights_keyword', {
          search_text: query,
          match_user_id: user.id,
          match_count: parsedLimit
        });

        if (error) {
          console.error('Keyword search error:', error);
          return NextResponse.json(
            { error: 'Failed to perform keyword search' },
            { status: 500 }
          );
        }

        searchResults = data || [];
        break;
      }

      case 'semantic': {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        const { data, error } = await supabase.rpc('search_highlights_semantic', {
          query_embedding: embeddingString,
          match_user_id: user.id,
          match_count: parsedLimit
        });

        if (error) {
          console.error('Semantic search error:', error);
          return NextResponse.json(
            { error: 'Failed to perform semantic search' },
            { status: 500 }
          );
        }

        searchResults = data || [];
        break;
      }

      case 'hybrid': {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        // Perform both searches in parallel
        const [semanticResult, keywordResult] = await Promise.all([
          supabase.rpc('search_highlights_semantic', {
            query_embedding: embeddingString,
            match_user_id: user.id,
            match_count: parsedLimit * 2
          }),
          supabase.rpc('search_highlights_keyword', {
            search_text: query,
            match_user_id: user.id,
            match_count: parsedLimit * 2
          })
        ]);

        if (semanticResult.error || keywordResult.error) {
          console.error('Hybrid search error:', semanticResult.error || keywordResult.error);
          return NextResponse.json(
            { error: 'Failed to perform hybrid search' },
            { status: 500 }
          );
        }

        // Reciprocal Rank Fusion (RRF) algorithm
        const k = 60;
        const scores = new Map<string, { highlight: any; score: number }>();

        // Add semantic search scores
        (semanticResult.data || []).forEach((result: any, index: number) => {
          const rank = index + 1;
          const score = 1 / (k + rank);
          scores.set(result.id, { highlight: result, score });
        });

        // Add keyword search scores
        (keywordResult.data || []).forEach((result: any, index: number) => {
          const rank = index + 1;
          const score = 1 / (k + rank);
          const existing = scores.get(result.id);
          if (existing) {
            existing.score += score;
          } else {
            scores.set(result.id, { highlight: result, score });
          }
        });

        // Sort by combined score and return top results
        searchResults = Array.from(scores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, parsedLimit)
          .map(item => ({
            ...item.highlight,
            score: item.score
          }));

        break;
      }

      default: {
        return NextResponse.json(
          { error: `Invalid search mode: ${mode}` },
          { status: 400 }
        );
      }
    }

    // Fetch full highlight details with relations
    const fullHighlights = await Promise.all(
      searchResults.map(async (result: any) => {
        const { data, error } = await supabase
          .from('highlights')
          .select(`
            *,
            categories:highlight_categories(
              category:categories(id, name)
            ),
            tags:highlight_tags(
              tag:tags(id, name)
            ),
            highlight_notes(
              note_id,
              notes:note_id(content)
            )
          `)
          .eq('id', result.id)
          .eq('user_id', user.id)
          .single();

        if (error || !data) return null;
        
        return {
          ...data,
          score: result.score || result.similarity || result.rank
        };
      })
    );

    // Map to domain format
    const results = fullHighlights
      .filter((highlight): highlight is NonNullable<typeof highlight> => highlight !== null)
      .map((highlight: any) => {
        // Extract categories
        const categories = (highlight.categories || []).map((catRel: any) => ({
          id: catRel.category.id,
          name: catRel.category.name
        }));

        // Extract tags
        const tags = (highlight.tags || []).map((tagRel: any) => ({
          id: tagRel.tag.id,
          name: tagRel.tag.name
        }));

        // Extract user note
        let userNote: string | null = null;
        if (highlight.highlight_notes && highlight.highlight_notes.length > 0) {
          userNote = highlight.highlight_notes[0].notes?.content || null;
        }

        return {
          id: highlight.id,
          bookId: highlight.book_id,
          rwId: highlight.rw_id,
          text: highlight.rw_text || '',
          note: highlight.rw_note,
          location: highlight.rw_location,
          locationType: highlight.rw_location_type,
          highlightedAt: highlight.rw_highlighted_at,
          url: highlight.rw_url,
          color: highlight.rw_color,
          categories,
          tags,
          userNote,
          createdAt: highlight.created_at,
          updatedAt: highlight.updated_at,
          score: highlight.score
        };
      });

    // Return results
    return NextResponse.json({
      results,
      count: results.length,
      mode,
      query
    });

  } catch (error) {
    console.error('Error in /api/highlights/search:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

